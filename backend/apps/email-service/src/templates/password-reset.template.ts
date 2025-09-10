export const passwordResetTemplate = {
  subject: 'รีเซ็ตรหัสผ่าน - {{appName}}',
  
  text: `
สวัสดี {{name}},

เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ

คลิกลิงก์ด้านล่างเพื่อรีเซ็ตรหัสผ่าน:
{{resetUrl}}

หรือใส่รหัสรีเซ็ตนี้: {{resetCode}}

ลิงก์นี้จะหมดอายุใน {{expiresIn}} นาที

หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้และเปลี่ยนรหัสผ่านของคุณเพื่อความปลอดภัย

ทีม {{appName}}
  `,

  html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>รีเซ็ตรหัสผ่าน</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #FF9800; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        .code { background: #fff3e0; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; border-radius: 4px; margin: 15px 0; }
        .warning { background: #ffebee; border: 1px solid #f8bbd9; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔑 รีเซ็ตรหัสผ่าน</h1>
        </div>
        
        <div class="content">
            <h2>สวัสดี {{name}}!</h2>
            
            <p>เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชี {{email}} ของคุณ</p>
            
            <p><strong>วิธีที่ 1:</strong> คลิกปุ่มด้านล่าง</p>
            <a href="{{resetUrl}}" class="button">รีเซ็ตรหัสผ่าน</a>
            
            <p><strong>วิธีที่ 2:</strong> ใส่รหัสรีเซ็ตนี้ในระบบ</p>
            <div class="code">{{resetCode}}</div>
            
            <div class="warning">
                <p><strong>🚨 คำเตือนด้านความปลอดภัย:</strong></p>
                <ul>
                    <li>ลิงก์นี้จะหมดอายุใน <strong>{{expiresIn}} นาติ</strong></li>
                    <li>หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้</li>
                    <li>แนะนำให้เปลี่ยนรหัสผ่านของคุณเพื่อความปลอดภัย</li>
                    <li>อย่าแชร์รหัสรีเซ็ตกับผู้อื่น</li>
                </ul>
            </div>
            
            <p>หากคุณต้องการความช่วยเหลือ กรุณาติดต่อทีมสนับสนุนของเรา</p>
        </div>
        
        <div class="footer">
            <p>ทีม {{appName}}<br>
            ติดต่อสนับสนุน: {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>
  `
};
