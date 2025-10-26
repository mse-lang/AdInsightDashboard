import { getUncachableResendClient } from './server/resendClient';

async function testEmail() {
  try {
    console.log('1. Fetching Resend client...');
    const { client, fromEmail } = await getUncachableResendClient();
    console.log('2. Client obtained successfully!');
    console.log('3. From email:', fromEmail);
    
    console.log('4. Sending test email to ad@venturesquare.net...');
    const result = await client.emails.send({
      from: fromEmail,
      to: 'ad@venturesquare.net',
      subject: '테스트 이메일 - 벤처스퀘어',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>테스트 이메일</h2>
          <p>이 이메일은 Resend 통합이 제대로 작동하는지 확인하기 위한 테스트 이메일입니다.</p>
          <p>이 이메일을 받으셨다면, 이메일 발송 시스템이 정상적으로 작동하고 있습니다! ✅</p>
        </div>
      `,
    });
    
    console.log('5. Email sent successfully!');
    console.log('Result:', result);
  } catch (error) {
    console.error('ERROR:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

testEmail();
