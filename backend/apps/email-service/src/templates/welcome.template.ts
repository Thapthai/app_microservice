export const welcomeTemplate = {
  subject: 'ยินดีต้อนรับสู่ระบบ {{appName}}',
  
  text: `
สวัสดี {{name}},

ยินดีต้อนรับสู่ {{appName}}! 

บัญชีของคุณได้ถูกสร้างเรียบร้อยแล้ว:
- อีเมล: {{email}}
- วันที่สมัคร: {{createdAt}}

คุณสามารถเข้าสู่ระบบได้ที่: {{loginUrl}}

หากมีคำถามใดๆ สามารถติดต่อเราได้ที่ {{supportEmail}}

ขอบคุณที่เลือกใช้บริการของเรา!

ทีม {{appName}}
  `,

  html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ยินดีต้อนรับ</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 ยินดีต้อนรับสู่ {{appName}}</h1>
        </div>
        
        <div class="content">
            <h2>สวัสดี {{name}}!</h2>
            
            <p>ยินดีต้อนรับสู่ {{appName}}! บัญชีของคุณได้ถูกสร้างเรียบร้อยแล้ว</p>
            
            <div style="background: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
                <h3>ข้อมูลบัญชี:</h3>
                <ul>
                    <li><strong>อีเมล:</strong> {{email}}</li>
                    <li><strong>วันที่สมัคร:</strong> {{createdAt}}</li>
                </ul>
            </div>
            
            <p>คุณสามารถเข้าสู่ระบบได้ทันที:</p>
            <a href="{{loginUrl}}" class="button">เข้าสู่ระบบ</a>
            
            <p>หากมีคำถามใดๆ สามารถติดต่อเราได้ที่ <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
        </div>
        
        <div class="footer">
            <p>ขอบคุณที่เลือกใช้บริการของเรา!<br>
            ทีม {{appName}}</p>
        </div>
    </div>
</body>
</html>
  `
};
