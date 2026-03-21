เอกสารวิเคราะห์ระบบเบื้องต้น
โครงการระบบเติมเกม / ระบบขายสินค้าดิจิทัลแบบ Multi-Supplier
Phase 1
1) วัตถุประสงค์ของระบบ

พัฒนาระบบสำหรับขายสินค้าดิจิทัลหรือเติมเกม โดยรองรับการเชื่อมต่อกับ Supplier หลายราย เพื่อให้ระบบสามารถเปรียบเทียบราคาและเลือกผู้ให้บริการที่มีต้นทุนดีที่สุดแบบอัตโนมัติ ก่อนทำรายการสั่งซื้อหรือเติมสินค้าให้ลูกค้า

ระบบต้องรองรับทั้งฝั่งผู้ใช้งานทั่วไปและฝั่งผู้ดูแลระบบ โดยมี Dashboard สำหรับติดตามยอดขาย กำไร ออเดอร์ และข้อมูลเชิงวิเคราะห์ รวมถึงมีระบบจัดการสินค้า ราคา โปรโมชั่น การชำระเงิน และการควบคุมความปลอดภัยในการทำธุรกรรม

2) ขอบเขตระบบใน Phase 1
2.1 Frontend

พัฒนาหน้าเว็บสำหรับผู้ใช้งานทั่วไป ประกอบด้วย

2.1.1 ระบบสมาชิก

สมัครสมาชิก

เข้าสู่ระบบ / ออกจากระบบ

จัดการข้อมูลโปรไฟล์

ประวัติการสั่งซื้อ

ประวัติการเติม Wallet

2.1.2 ระบบ Wallet

เติมเงินเข้า Wallet

แสดงยอดเงินคงเหลือ

หักยอด Wallet เมื่อสั่งซื้อ

แสดงประวัติการเคลื่อนไหวของ Wallet

2.2 Backend

พัฒนาระบบหลังบ้านและ API สำหรับการประมวลผลธุรกิจหลัก

2.2.1 ระบบเลือก Supplier ที่ราคาถูกที่สุด

ระบบต้องสามารถทำงานตามลำดับดังนี้

ดึงราคาสินค้าจาก Supplier ทุกเจ้า

เปรียบเทียบราคา

เลือก Supplier ที่มีราคาต่ำที่สุด

ส่งคำสั่งซื้อหรือคำสั่งเติมสินค้าไปยัง Supplier ที่ถูกเลือก

บันทึกผลลัพธ์ของการทำรายการ

2.2.2 ระบบจัดการสินค้า

เพิ่ม / แก้ไข / ปิดการขายสินค้า

ตั้งราคาขาย

จัดหมวดหมู่สินค้า

ตั้งโปรโมชั่น

กำหนดการแสดงผลสินค้า

2.2.3 ระบบ Analytics

วิเคราะห์ว่าลูกค้าซื้อสินค้าอะไรบ่อย

วิเคราะห์ช่วงเวลาที่ขายดี

วิเคราะห์สินค้าหรือเกมที่ทำกำไรสูง

สรุปยอดขายตามช่วงเวลา

2.2.4 Dashboard

ดูรายได้รวม

ดูกำไรรวม

ดูจำนวนออเดอร์

ดูสถานะคำสั่งซื้อ

ดูผลการเลือก Supplier

ดูข้อมูลเปรียบเทียบต้นทุนจากหลาย Supplier

2.3 ระบบป้องกันการโกง / ความถูกต้องของการชำระเงิน

ตรวจสอบสถานะการชำระเงินจาก Payment Gateway

รองรับการรับ Webhook จากระบบชำระเงิน

ตรวจสอบรายการซ้ำ

ป้องกันการสร้างรายการปลอม

บันทึก Log การตรวจสอบธุรกรรม

2.4 ระบบชำระเงิน

รองรับการชำระเงินหลายรูปแบบ เช่น

PromptPay QR

ระบบตรวจสอบ Slip

Omise

ช่องทางชำระเงินอื่น ๆ ที่จะเพิ่มในอนาคต

2.5 Supplier API

เชื่อมต่อ API Supplier หลายราย

ดึงข้อมูลสินค้า ราคา และสถานะ

ส่งคำสั่งซื้อ / เติมสินค้า

รองรับการ mapping request / response ของแต่ละ Supplier

รองรับการตั้งค่า API Key หรือ Credential แยกตาม Supplier

2.6 Database

ใช้ฐานข้อมูลสำหรับจัดเก็บข้อมูลสำคัญ เช่น

สมาชิก

Wallet

รายการสินค้า

ราคา Supplier

คำสั่งซื้อ

ธุรกรรมชำระเงิน

Log การเชื่อมต่อ API

ข้อมูล Analytics

2.7 Queue / Job Processing

ใช้ระบบ Queue เพื่อช่วยให้ระบบเสถียร รองรับโหลดสูง และลดปัญหาระบบล่มจากการยิง API พร้อมกันจำนวนมาก

แนวคิดหลัก:

จะไม่ยิง Supplier API ตรงจากหน้าเว็บ

เมื่อผู้ใช้สั่งซื้อ ระบบจะสร้าง Job เข้าคิว

Worker จะดึง Job ไปประมวลผล

เมื่อทำรายการสำเร็จหรือผิดพลาด ระบบจะอัปเดตสถานะกลับมา

ประโยชน์:

ลดภาระ Backend หลัก

ป้องกันระบบล่มในช่วงโหลดสูง

รองรับ Retry กรณีเชื่อมต่อ Supplier ล้มเหลว

ตรวจสอบสถานะงานได้ง่ายขึ้น

2.8 Server / Infrastructure

Web Server สำหรับ Frontend และ Backend

Database Server

Redis สำหรับ Cache / Queue / Session

Kafka สำหรับ Event Streaming และ Integration ระหว่าง Service

ระบบ Monitoring / Logging สำหรับตรวจสอบสถานะระบบ

3) ส่วนที่ควรเพิ่มเติมจากเอกสารเดิม

จากข้อมูลเดิม ยังมีหลายส่วนที่ควรเพิ่มเพื่อให้เอกสารพร้อมสำหรับใช้คุยกับทีมพัฒนา, BA, SA, DevOps และผู้บริหาร

3.1 เพิ่มขอบเขตผู้ใช้งานแต่ละ Role

ควรกำหนดสิทธิ์ผู้ใช้งานให้ชัดเจน เช่น

3.1.1 Customer

สมัครสมาชิก

เติม Wallet

ซื้อสินค้า

ดูประวัติคำสั่งซื้อ

3.1.2 Admin

จัดการสินค้า

จัดการราคา

จัดการโปรโมชั่น

จัดการ Supplier

จัดการ API Key

ดูรายงาน / Dashboard

ตรวจสอบคำสั่งซื้อ

ตรวจสอบ Payment และ Webhook

3.1.3 Super Admin

จัดการ Role และ Permission

จัดการ Master Data

ตั้งค่าระบบ

ตั้งค่า Mapping ของ Supplier API

จัดการ Retry / Reprocess Job

ดู System Log / Audit Log

3.2 เพิ่มระบบจัดการ Master Data

ควรมีเมนูบนหน้า Admin สำหรับจัดการข้อมูลหลัก เช่น

Supplier

Product Category

Product Master

Payment Channel

Promotion Type

API Endpoint Config

API Key / Secret

Mapping Template ของแต่ละ Supplier

3.3 เพิ่มระบบ API Mapping

หัวข้อนี้สำคัญมาก เพราะ Supplier แต่ละรายมักส่งข้อมูลกลับมาไม่เหมือนกัน

ควรมีระบบจัดการ

Mapping Request ของแต่ละ Supplier

Mapping Response ของแต่ละ Supplier

Mapping สถานะ เช่น SUCCESS / PENDING / FAILED

Mapping Error Code

ตั้งค่าฟิลด์ที่ใช้ร่วมกันเป็นมาตรฐานกลางของระบบ

ตัวอย่าง:

supplier_status = “done” → system_status = “SUCCESS”

supplier_status = “processing” → system_status = “PENDING”

3.4 เพิ่มระบบจัดการ API Key

ควรมีหน้า Admin สำหรับ

เก็บ API Key ของ Supplier

เปิด/ปิดการใช้งาน

กำหนดวันหมดอายุ

กำหนด environment เช่น UAT / PROD

เข้ารหัสข้อมูลสำคัญ

บันทึกว่าใครแก้ไขล่าสุด

3.5 เพิ่ม Order Management

ควรมีหน้าจัดการคำสั่งซื้อ

ดูรายการออเดอร์

ค้นหาออเดอร์

กรองตามสถานะ

Retry รายการที่ล้มเหลว

ยกเลิกรายการ

ดูรายละเอียดการเรียก Supplier API

ดู Timeline ของ Order

3.6 เพิ่มระบบแจ้งเตือน

แจ้งเตือนเมื่อ Supplier ล่ม

แจ้งเตือนเมื่อ Queue ค้าง

แจ้งเตือนเมื่อ Payment ผิดปกติ

แจ้งเตือนเมื่อยอดขายลดลงผิดปกติ

แจ้งเตือนผ่าน Email / LINE / Telegram / Slack

3.7 เพิ่มระบบ Audit Log

ควรบันทึกทุกการกระทำสำคัญ เช่น

ใครแก้ราคา

ใครเปลี่ยน API Key

ใครแก้ Mapping

ใครทำ Retry Order

ใครเปิด/ปิด Supplier

3.8 เพิ่ม Non-Functional Requirements

เอกสารเดิมยังไม่มีหัวข้อนี้ แต่สำคัญมาก

ควรระบุอย่างน้อย:

Performance: รองรับจำนวนคำสั่งซื้อพร้อมกัน

Availability: ระบบต้องพร้อมใช้งานกี่ %

Security: เข้ารหัสข้อมูลสำคัญ, RBAC, Audit Log

Scalability: รองรับ Supplier เพิ่มในอนาคต

Maintainability: แยก service ชัดเจน

Observability: มี log, metric, tracing

4) โครงสร้างระบบที่แนะนำ
4.1 Frontend

React

MUI Theme สีแดง

รองรับทั้งฝั่งลูกค้าและ Admin บนเว็บเดียวกัน

ใช้ Role-Based Menu แสดงเมนูตามสิทธิ์ผู้ใช้

4.2 Backend

แยก Service ตาม Domain เช่น

Auth Service

User Service

Wallet Service

Product Service

Order Service

Payment Service

Supplier Integration Service

Admin Config Service

Analytics Service

4.3 Database

PostgreSQL เป็นฐานข้อมูลหลัก

4.4 Redis

ใช้สำหรับ

Cache

Session

Rate limiting

Queue state

Temporary data

4.5 Kafka

ใช้สำหรับ

ส่ง Event ระหว่าง Service

ประมวลผลแบบ asynchronous

รองรับการแยก service ในอนาคต

เก็บ event เช่น OrderCreated, PaymentSuccess, TopupRequested, SupplierCompleted

4.6 Queue Worker

รับงานเติมเกม / สั่งซื้อ

Retry ได้

Dead Letter Queue ได้

แยก worker ตามประเภทงาน

5) เมนู Admin ที่ควรมีบนเว็บ
5.1 Dashboard

รายได้

กำไร

จำนวนออเดอร์

สถานะระบบ

สถานะ Supplier

สถานะ Queue

5.2 User Management

จัดการสมาชิก

ดูประวัติการใช้งาน

ระงับการใช้งาน

5.3 Role & Permission

จัดการสิทธิ์ผู้ใช้งาน

กำหนดเมนูที่เข้าถึงได้

5.4 Product Management

จัดการสินค้า

ราคา

โปรโมชั่น

หมวดหมู่

5.5 Supplier Management

เพิ่ม / แก้ไข Supplier

ตั้งค่า API Endpoint

ตั้งค่า Priority

เปิด / ปิดการใช้งาน

5.6 API Key Management

จัดการ API Key

กำหนด environment

เปิด / ปิด key

ตรวจสอบวันหมดอายุ

5.7 Response Mapping Management

จัดการ mapping response

mapping error code

mapping status

preview ตัวอย่าง response

5.8 Payment Management

ดูรายการชำระเงิน

ตรวจสอบ webhook

ตรวจสอบ slip

reconcile payment

5.9 Order Management

ดูออเดอร์

Retry / Cancel / Reprocess

ดูรายละเอียด response จาก Supplier

5.10 Analytics & Report

รายงานยอดขาย

รายงานกำไร

รายงานสินค้าขายดี

รายงานช่วงเวลาขายดี

5.11 System Monitoring

Queue status

Kafka consumer / producer status

Redis status

API response time

Error log

5.12 Audit Log

ประวัติการเปลี่ยนแปลงข้อมูลสำคัญทั้งหมด

6) Flow การทำงานหลักของระบบ
6.1 การสั่งซื้อสินค้า / เติมเกม

ลูกค้าเลือกสินค้า

ระบบตรวจสอบราคาและข้อมูลสินค้า

ลูกค้าชำระเงินผ่าน Wallet หรือ Payment Gateway

เมื่อชำระเงินสำเร็จ ระบบสร้าง Order

ระบบส่ง Job เข้าสู่ Queue

Worker ดึง Job ไปประมวลผล

ระบบดึงราคาจาก Supplier หรือเลือก Supplier ที่เหมาะสม

ระบบส่งคำสั่งเติมสินค้าไปยัง Supplier

ระบบรับผลลัพธ์กลับ

อัปเดตสถานะ Order

แจ้งผลให้ลูกค้า

7) ความเสี่ยงที่ควรระบุในเอกสาร

Supplier API ล่มหรือ response ช้า

ราคาจาก Supplier เปลี่ยนระหว่างทำรายการ

Payment webhook ซ้ำ

ลูกค้าจ่ายเงินแล้วแต่ Supplier ไม่สำเร็จ

Queue ค้าง

Mapping ผิด ทำให้ตีความสถานะผิด

API Key หมดอายุ

ระบบถูกโจมตีจาก request จำนวนมาก

8) ข้อเสนอแนะเพิ่มเติม

ถ้าจะให้เอกสารพร้อมใช้ต่อจริง แนะนำเพิ่มหัวข้อเหล่านี้ในรอบถัดไป

ER Diagram

System Architecture Diagram

API List

ตารางสิทธิ์ Role Matrix

Order Status Flow

Supplier Status Mapping Table

Payment Reconciliation Flow

Retry / Refund / Compensation Process

Security Design

Deployment Architecture