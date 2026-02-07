require('dotenv').config();
const PHONE_NUMBER_ID = process.env.PHONE_ID;
const ACCESS_TOKEN = process.env.WA_APP;

function formatPhoneNumber(phoneNumber) {
  if (phoneNumber.startsWith('0')) {
    return '966' + phoneNumber.slice(1);
  }

  if (
    phoneNumber.startsWith('966') ||
    phoneNumber.startsWith('20') ||
    phoneNumber.startsWith('970')
  ) {
    return phoneNumber;
  }

  return '966' + phoneNumber;
}

async function sendTaskNotification(phoneNumber, taskData) {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;

    const body = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: 'whats_notification',
        language: {
          code: 'ar'
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                parameter_name: 'task_title',
                text: taskData.title
              },
              {
                type: 'text',
                parameter_name: 'task_details',
                text: taskData.description || 'لا توجد تفاصيل'
              },
              {
                type: 'text',
                parameter_name: 'task_duedate',
                text: taskData.due_date
              }
            ]
          }
        ]
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.error) {
      console.error('❌ خطأ في إرسال الواتساب:', data.error);
      return { success: false, error: data.error };
    }

    console.log('✅ تم إرسال الرسالة بنجاح:', data);
    return { success: true, messageId: data.messages[0].id };

  } catch (error) {
    console.error('❌ خطأ في إرسال الواتساب:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendTaskNotification
};