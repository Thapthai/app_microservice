export const emailOTPTemplate = {
  subject: 'รหัส OTP สำหรับ {{appName}}',
  
  text: `
สวัสดี {{name}},

รหัส OTP ของคุณสำหรับ {{purpose}}: {{otp}}

รหัสนี้จะหมดอายุใน {{expiresIn}} นาที

หากคุณไม่ได้ขอรหัสนี้ กรุณาเพิกเฉยต่ออีเมลนี้

ทีม {{appName}}
  `,

  html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>รหัส OTP</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; background: #f8f9fa; border-radius: 0 0 8px 8px; }
        .otp-box { 
            background: white; 
            padding: 25px; 
            text-align: center; 
            border-radius: 8px; 
            margin: 20px 0; 
            border: 2px solid #007bff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .otp-code { 
            font-size: 32px; 
            font-weight: bold; 
            color: #007bff; 
            letter-spacing: 4px; 
            margin: 10px 0;
            font-family: 'Courier New', monospace;
        }
        .warning { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            padding: 15px; 
            border-radius: 4px; 
            margin: 20px 0; 
        }
        .footer { 
            text-align: center; 
            padding: 20px; 
            font-size: 12px; 
            color: #666; 
        }
        .purpose {
            background: #e3f2fd;
            padding: 10px;
            border-radius: 4px;
            margin: 15px 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 รหัส OTP</h1>
        </div>
        
        <div class="content">
            <h2>สวัสดี {{name}}!</h2>
            
            <div class="purpose">
                <strong>วัตถุประสงค์:</strong> {{purpose}}
            </div>
            
            <p>รหัส OTP ของคุณคือ:</p>
            
            <div class="otp-box">
                <div style="color: #666; font-size: 14px;">รหัส OTP</div>
                <div class="otp-code">{{otp}}</div>
                <div style="color: #666; font-size: 12px;">หมดอายุใน {{expiresIn}} นาที</div>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
                <p><strong>⏰ รหัสนี้จะหมดอายุใน {{expiresIn}} นาที</strong></p>
                <p>กรุณาใส่รหัสในระบบเพื่อดำเนินการต่อ</p>
            </div>
            
            <div class="warning">
                <p><strong>⚠️ คำเตือนด้านความปลอดภัย:</strong></p>
                <ul>
                    <li>อย่าแชร์รหัส OTP นี้กับผู้อื่น</li>
                    <li>หากคุณไม่ได้ขอรหัสนี้ กรุณาเพิกเฉยต่ออีเมลนี้</li>
                    <li>รหัสนี้ใช้ได้เพียงครั้งเดียว</li>
                    <li>ติดต่อทีมสนับสนุนหากมีปัญหา</li>
                </ul>
            </div>
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
