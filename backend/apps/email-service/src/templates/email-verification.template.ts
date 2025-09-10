export const emailVerificationTemplate = {
  subject: 'ยืนยันอีเมลของคุณ - {{appName}}',
  
  text: `
สวัสดี {{name}},

กรุณายืนยันอีเมลของคุณเพื่อเปิดใช้งานบัญชี

คลิกลิงก์ด้านล่างเพื่อยืนยัน:
{{verificationUrl}}

หรือใส่รหัสยืนยันนี้: {{verificationCode}}

ลิงก์นี้จะหมดอายุใน {{expiresIn}} นาที

หากคุณไม่ได้สมัครบัญชีนี้ กรุณาเพิกเฉยต่ออีเมลนี้

ทีม {{appName}}
  `,

  html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ยืนยันอีเมล</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #2196F3; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        .code { background: #e3f2fd; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; border-radius: 4px; margin: 15px 0; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 ยืนยันอีเมลของคุณ</h1>
        </div>
        
        <div class="content">
            <h2>สวัสดี {{name}}!</h2>
            
            <p>กรุณายืนยันอีเมลของคุณเพื่อเปิดใช้งานบัญชีใน {{appName}}</p>
            
            <p><strong>วิธีที่ 1:</strong> คลิกปุ่มด้านล่าง</p>
            <a href="{{verificationUrl}}" class="button">ยืนยันอีเมล</a>
            
            <p><strong>วิธีที่ 2:</strong> ใส่รหัสยืนยันนี้ในระบบ</p>
            <div class="code">{{verificationCode}}</div>
            
            <div class="warning">
                <p><strong>⚠️ หมายเหตุ:</strong></p>
                <ul>
                    <li>ลิงก์นี้จะหมดอายุใน <strong>{{expiresIn}} นาที</strong></li>
                    <li>หากคุณไม่ได้สมัครบัญชีนี้ กรุณาเพิกเฉยต่ออีเมลนี้</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p>ทีม {{appName}}<br>
            หากมีปัญหา ติดต่อ: {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>
  `
};
