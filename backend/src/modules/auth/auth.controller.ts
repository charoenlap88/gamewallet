import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  GoogleAuthDto,
  Complete2faDto,
  TotpEnableDto,
  EmailEnableRequestDto,
  EmailEnableConfirmDto,
  Disable2faDto,
} from './dto/auth.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/types/request-user';
import { clientIp, clientUserAgent } from '../../common/utils/request.util';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new customer account' })
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, {
      ipAddress: clientIp(req),
      userAgent: clientUserAgent(req),
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login — may require 2FA second step' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, {
      ipAddress: clientIp(req),
      userAgent: clientUserAgent(req),
    });
  }

  @Post('2fa/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete login after TOTP or email code' })
  complete2fa(@Body() dto: Complete2faDto, @Req() req: Request) {
    return this.authService.complete2fa(dto, {
      ipAddress: clientIp(req),
      userAgent: clientUserAgent(req),
    });
  }

  @Post('2fa/email/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email OTP (uses pendingToken from login)' })
  resendEmail2fa(@Body() body: { pendingToken: string }) {
    return this.authService.resendEmail2fa(body.pendingToken);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in or register with Google ID token' })
  google(@Body() dto: GoogleAuthDto, @Req() req: Request) {
    return this.authService.googleAuth(dto, {
      ipAddress: clientIp(req),
      userAgent: clientUserAgent(req),
    });
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: RequestUser) {
    return this.authService.getProfile(user.id);
  }

  @Patch('change-password')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  changePassword(@CurrentUser() user: RequestUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  @Post('2fa/totp/setup')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start TOTP (Google Authenticator) — returns secret + otpauth URL' })
  totpSetup(@CurrentUser() user: RequestUser) {
    return this.authService.totpSetup(user.id);
  }

  @Post('2fa/totp/enable')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm TOTP with first code from app' })
  totpEnable(@CurrentUser() user: RequestUser, @Body() dto: TotpEnableDto) {
    return this.authService.totpEnable(user.id, dto.code);
  }

  @Post('2fa/email/request-enable')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send email code to enable email 2FA' })
  emailRequestEnable(@CurrentUser() user: RequestUser, @Body() dto: EmailEnableRequestDto) {
    return this.authService.emailRequestEnable(user.id, dto.password);
  }

  @Post('2fa/email/confirm-enable')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm email code to enable email 2FA' })
  emailConfirmEnable(@CurrentUser() user: RequestUser, @Body() dto: EmailEnableConfirmDto) {
    return this.authService.emailConfirmEnable(user.id, dto.code);
  }

  @Post('2fa/email/send-disable')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send email code before disabling email 2FA' })
  sendDisable2faEmail(@CurrentUser() user: RequestUser) {
    return this.authService.sendDisable2faEmail(user.id);
  }

  @Post('2fa/disable')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA (password + TOTP or email code)' })
  disable2fa(@CurrentUser() user: RequestUser, @Body() dto: Disable2faDto) {
    return this.authService.disable2fa(user.id, dto.password, dto.code);
  }
}
