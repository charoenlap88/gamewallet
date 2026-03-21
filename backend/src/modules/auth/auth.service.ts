import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { generateSecret, generateURI, verifySync } from 'otplib';
import {
  AuditAction,
  User,
  UserRole,
  UserStatus,
  TwoFactorMethod,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, GoogleAuthDto } from './dto/auth.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { resolveNavMenuKeys } from '../../common/utils/nav-menu-keys.util';
import { TwoFactorService } from './two-factor.service';
import { MailerService } from './mailer.service';

type AuthRequestMeta = { ipAddress?: string; userAgent?: string };

export type PublicUser = ReturnType<AuthService['buildPublicUser']>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditLogService: AuditLogService,
    private readonly twoFactorService: TwoFactorService,
    private readonly mailer: MailerService,
  ) {}

  async register(dto: RegisterDto, meta?: AuthRequestMeta) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) {
      throw new ConflictException('Email or username already registered');
    }

    let agentId: string | undefined;
    if (dto.referralCode?.trim()) {
      const code = dto.referralCode.trim().toUpperCase();
      const agent = await this.prisma.user.findFirst({
        where: {
          agentCode: code,
          role: UserRole.AGENT,
          status: UserStatus.ACTIVE,
        },
      });
      if (agent) agentId = agent.id;
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashedPassword,
        fullName: dto.fullName,
        phone: dto.phone,
        agentId,
        wallet: { create: { balance: 0 } },
      },
      include: { navRole: true },
    });

    await this.auditLogService.logSafe({
      userId: user.id,
      action: AuditAction.CREATE,
      module: 'AUTH',
      description: `ลงทะเบียนบัญชี: ${user.email}`,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return {
      token: this.generateToken(user),
      user: this.buildPublicUser(user),
    };
  }

  async googleAuth(dto: GoogleAuthDto, meta?: AuthRequestMeta) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new BadRequestException('Google sign-in is not configured (GOOGLE_CLIENT_ID)');
    }

    const client = new OAuth2Client(clientId);
    let payload: {
      email?: string;
      sub?: string;
      email_verified?: boolean;
      name?: string;
    } | null = null;

    try {
      const ticket = await client.verifyIdToken({
        idToken: dto.idToken,
        audience: clientId,
      });
      payload = ticket.getPayload() ?? null;
    } catch {
      throw new UnauthorizedException('Invalid or expired Google token');
    }

    if (!payload?.email || !payload.sub) {
      throw new UnauthorizedException('Google token missing email or subject');
    }
    if (payload.email_verified === false) {
      throw new BadRequestException('Google email is not verified');
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const fullNameFromGoogle = payload.name ?? undefined;

    let user = await this.prisma.user.findUnique({
      where: { googleId },
      include: { navRole: true, wallet: true },
    });

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email },
        include: { navRole: true, wallet: true },
      });
    }

    if (user) {
      if (user.googleId && user.googleId !== googleId) {
        throw new ConflictException('This account is linked to a different Google sign-in');
      }
      if (user.status === UserStatus.SUSPENDED) {
        throw new UnauthorizedException('Account is suspended');
      }

      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            fullName: user.fullName ?? fullNameFromGoogle,
          },
          include: { navRole: true, wallet: true },
        });
      }

      return this.maybe2faLogin(
        user,
        meta,
        `เข้าสู่ระบบด้วย Google: ${user.email} (${user.role})`,
      );
    }

    let agentId: string | undefined;
    const ref = dto.referralCode?.trim();
    if (ref) {
      const code = ref.toUpperCase();
      const agent = await this.prisma.user.findFirst({
        where: {
          agentCode: code,
          role: UserRole.AGENT,
          status: UserStatus.ACTIVE,
        },
      });
      if (agent) agentId = agent.id;
    }

    const username = await this.generateUniqueUsername(email);
    const created = await this.prisma.user.create({
      data: {
        email,
        username,
        password: null,
        fullName: fullNameFromGoogle,
        googleId,
        agentId,
        role: UserRole.CUSTOMER,
        wallet: { create: { balance: 0 } },
      },
      include: { navRole: true, wallet: true },
    });

    await this.auditLogService.logSafe({
      userId: created.id,
      action: AuditAction.CREATE,
      module: 'AUTH',
      description: `ลงทะเบียนด้วย Google: ${created.email}`,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return {
      token: this.generateToken(created),
      user: this.buildPublicUser(created),
    };
  }

  private async generateUniqueUsername(email: string): Promise<string> {
    const local = email
      .split('@')[0]
      ?.replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 24);
    const base = local && local.length > 0 ? local : 'user';
    let candidate = base;
    let tries = 0;
    while (tries < 30) {
      const exists = await this.prisma.user.findUnique({ where: { username: candidate } });
      if (!exists) return candidate;
      const suffix = Math.random().toString(36).slice(2, 8);
      candidate = `${base.slice(0, 18)}_${suffix}`;
      tries++;
    }
    return `user_${Date.now().toString(36)}`;
  }

  async login(dto: LoginDto, meta?: AuthRequestMeta) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { navRole: true, wallet: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account is suspended');
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'This account uses Google sign-in. Please use "Continue with Google".',
      );
    }

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.maybe2faLogin(
      user,
      meta,
      `เข้าสู่ระบบ: ${user.email} (${user.role})`,
    );
  }

  private async maybe2faLogin(
    user: User & { navRole?: unknown; wallet?: unknown },
    meta: AuthRequestMeta | undefined,
    auditDescription: string,
  ): Promise<
    | { token: string; user: PublicUser }
    | { requiresTwoFactor: true; twoFactorMethod: TwoFactorMethod; pendingToken: string }
  > {
    if (user.twoFactorMethod === TwoFactorMethod.NONE) {
      await this.auditLogService.logSafe({
        userId: user.id,
        action: AuditAction.LOGIN,
        module: 'AUTH',
        description: auditDescription,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      });
      return {
        token: this.generateToken(user),
        user: this.buildPublicUser(user as Parameters<AuthService['buildPublicUser']>[0]),
      };
    }

    if (user.twoFactorMethod === TwoFactorMethod.EMAIL) {
      const code = await this.twoFactorService.createEmailOtp(user.id, 'LOGIN');
      await this.mailer.sendMail(
        user.email,
        'GameWallet — รหัสยืนยันเข้าสู่ระบบ',
        `รหัส 6 หลักของคุณ: ${code}\nหมดอายุใน 10 นาที`,
      );
    }

    return {
      requiresTwoFactor: true,
      twoFactorMethod: user.twoFactorMethod,
      pendingToken: this.sign2faPending(user),
    };
  }

  async complete2fa(
    dto: { pendingToken: string; code: string },
    meta?: AuthRequestMeta,
  ): Promise<{ token: string; user: PublicUser }> {
    let decoded: {
      sub: string;
      purpose?: string;
      twoFactorMethod?: TwoFactorMethod;
    };
    try {
      decoded = this.jwtService.verify(dto.pendingToken) as typeof decoded;
    } catch {
      throw new UnauthorizedException('Invalid or expired verification token');
    }
    if (decoded.purpose !== '2fa_pending') {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { navRole: true, wallet: true },
    });
    if (!user || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('User not found');
    }

    const method = user.twoFactorMethod;
    if (method === TwoFactorMethod.NONE) {
      throw new BadRequestException('2FA is not enabled for this account');
    }

    if (method === TwoFactorMethod.TOTP) {
      if (!user.totpSecret) {
        throw new BadRequestException('TOTP not configured');
      }
      const v = verifySync({ secret: user.totpSecret, token: dto.code.trim() });
      if (!v.valid) {
        throw new UnauthorizedException('Invalid authenticator code');
      }
    } else if (method === TwoFactorMethod.EMAIL) {
      const ok = await this.twoFactorService.verifyEmailOtp(user.id, dto.code, 'LOGIN');
      if (!ok) {
        throw new UnauthorizedException('Invalid email code');
      }
    }

    await this.auditLogService.logSafe({
      userId: user.id,
      action: AuditAction.LOGIN,
      module: 'AUTH',
      description: `เข้าสู่ระบบ (2FA): ${user.email} (${user.role})`,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return {
      token: this.generateToken(user),
      user: this.buildPublicUser(user as Parameters<AuthService['buildPublicUser']>[0]),
    };
  }

  async resendEmail2fa(pendingToken: string): Promise<{ ok: boolean }> {
    let decoded: { sub: string; purpose?: string };
    try {
      decoded = this.jwtService.verify(pendingToken) as typeof decoded;
    } catch {
      throw new UnauthorizedException('Invalid or expired verification token');
    }
    if (decoded.purpose !== '2fa_pending') {
      throw new UnauthorizedException('Invalid or expired verification token');
    }
    const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user || user.twoFactorMethod !== TwoFactorMethod.EMAIL) {
      throw new BadRequestException('Email 2FA is not active for this session');
    }
    const code = await this.twoFactorService.createEmailOtp(user.id, 'LOGIN');
    await this.mailer.sendMail(
      user.email,
      'GameWallet — รหัสยืนยันเข้าสู่ระบบ',
      `รหัส 6 หลักของคุณ: ${code}\nหมดอายุใน 10 นาที`,
    );
    return { ok: true };
  }

  async totpSetup(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.twoFactorMethod !== TwoFactorMethod.NONE) {
      throw new BadRequestException('Disable current 2FA before setting up a new method');
    }

    const secret = generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecretPending: secret },
    });
    const otpauthUrl = generateURI({
      issuer: 'GameWallet',
      label: user.email,
      secret,
    });
    return { secret, otpauthUrl };
  }

  async totpEnable(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpSecretPending) {
      throw new BadRequestException('Run TOTP setup first');
    }
    const v = verifySync({ secret: user.totpSecretPending, token: code.trim() });
    if (!v.valid) {
      throw new UnauthorizedException('Invalid code');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: user.totpSecretPending,
        totpSecretPending: null,
        twoFactorMethod: TwoFactorMethod.TOTP,
      },
    });
    return { message: 'เปิดใช้ Google Authenticator (TOTP) แล้ว' };
  }

  async emailRequestEnable(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.password) throw new BadRequestException('Set a password first');
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('รหัสผ่านไม่ถูกต้อง');
    if (user.twoFactorMethod !== TwoFactorMethod.NONE) {
      throw new BadRequestException('Disable current 2FA first');
    }
    const code = await this.twoFactorService.createEmailOtp(userId, 'ENABLE_EMAIL');
    await this.mailer.sendMail(
      user.email,
      'GameWallet — ยืนยันเปิด 2FA ทางอีเมล',
      `รหัส 6 หลัก: ${code}\nหมดอายุใน 10 นาที`,
    );
    return { message: 'ส่งรหัสไปที่อีเมลแล้ว' };
  }

  async emailConfirmEnable(userId: string, code: string) {
    const ok = await this.twoFactorService.verifyEmailOtp(userId, code, 'ENABLE_EMAIL');
    if (!ok) throw new UnauthorizedException('รหัสไม่ถูกต้องหรือหมดอายุ');
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorMethod: TwoFactorMethod.EMAIL },
    });
    return { message: 'เปิดใช้ 2FA ทางอีเมลแล้ว' };
  }

  async disable2fa(userId: string, password: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.password) throw new BadRequestException('Set a password first');
    const pwdOk = await bcrypt.compare(password, user.password);
    if (!pwdOk) throw new UnauthorizedException('รหัสผ่านไม่ถูกต้อง');

    if (user.twoFactorMethod === TwoFactorMethod.TOTP) {
      if (!user.totpSecret) throw new BadRequestException('Invalid state');
      const v = verifySync({ secret: user.totpSecret, token: code.trim() });
      if (!v.valid) throw new UnauthorizedException('รหัสจากแอปไม่ถูกต้อง');
    } else if (user.twoFactorMethod === TwoFactorMethod.EMAIL) {
      const codeOk = await this.twoFactorService.verifyEmailOtp(userId, code, 'DISABLE_2FA');
      if (!codeOk) {
        throw new UnauthorizedException('รหัสอีเมลไม่ถูกต้อง — กดส่งรหัสปิด 2FA ก่อน');
      }
    } else {
      throw new BadRequestException('2FA is not enabled');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorMethod: TwoFactorMethod.NONE,
        totpSecret: null,
        totpSecretPending: null,
      },
    });
    return { message: 'ปิด 2FA แล้ว' };
  }

  async sendDisable2faEmail(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.twoFactorMethod !== TwoFactorMethod.EMAIL) {
      throw new BadRequestException('ใช้ได้เมื่อเปิด 2FA แบบอีเมลเท่านั้น');
    }
    const code = await this.twoFactorService.createEmailOtp(userId, 'DISABLE_2FA');
    await this.mailer.sendMail(
      user.email,
      'GameWallet — รหัสปิด 2FA',
      `รหัส 6 หลัก: ${code}\nใช้คู่กับรหัสผ่านในหน้าปิด 2FA`,
    );
    return { message: 'ส่งรหัสไปที่อีเมลแล้ว' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    if (!user.password) {
      throw new BadRequestException('บัญชีนี้เข้าสู่ระบบด้วย Google เท่านั้น — ยังไม่รองรับการตั้งรหัสผ่านจากหน้านี้');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new BadRequestException('รหัสผ่านปัจจุบันไม่ถูกต้อง');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
    return { message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true, navRole: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.buildPublicUser(user);
  }

  private sign2faPending(user: User) {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        purpose: '2fa_pending',
        twoFactorMethod: user.twoFactorMethod,
      },
      { expiresIn: '10m' },
    );
  }

  private generateToken(user: User) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      purpose: 'access',
    });
  }

  private buildPublicUser(
    user: User & { wallet?: unknown; navRole?: { menuKeys: string[] } | null },
  ) {
    const {
      password: _p,
      googleId: _g,
      totpSecret: _ts,
      totpSecretPending: _tsp,
      ...rest
    } = user as User & {
      password: string | null;
      googleId: string | null;
      totpSecret: string | null;
      totpSecretPending: string | null;
    } & Record<string, unknown>;
    const navMenuKeys = resolveNavMenuKeys(user.role, user.navRole ?? null);
    return {
      ...rest,
      navMenuKeys,
      hasPassword: !!user.password,
      googleLinked: !!user.googleId,
    };
  }
}
