require('dotenv').config();
const PHONE_NUMBER_ID = process.env.PHONE_ID;
const ACCESS_TOKEN = process.env.WA_APP;

function formatPhoneNumber(phoneNumber) {
  let formattedPhone = phoneNumber;

  if (phoneNumber.startsWith('0')) {
    formattedPhone = '966' + phoneNumber.slice(1);
  } else if (!phoneNumber.startsWith('966')) {
    formattedPhone = '966' + phoneNumber;
  }

  return formattedPhone;
}
/*
async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    // تنسيق رقم الجوال
/*
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedPhone = '966' + phoneNumber.slice(1);
    } else if (!phoneNumber.startsWith('966')) {
      formattedPhone = '966' + phoneNumber;
    }

    const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;

    /*const body = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: {
        body: message
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

// دالة إرسال إشعار مهمة
/*
async function sendTaskNotification(phone, taskData) {
  const message = `🔔 مهمة جديدة

📋 العنوان: ${taskData.title}
📝 التفاصيل: ${taskData.description || 'لا توجد تفاصيل'}
📅 تاريخ التسليم: ${taskData.due_date}
⚠️ الأولوية: ${taskData.priority || 'متوسطة'}

✅ يرجى تسجيل الدخول للنظام لعرض المهمة كاملة`;

  return await sendWhatsAppMessage(phone, message);
}
async function sendTaskNotification(phoneNumber, taskData) {
  const formattedPhone = formatPhoneNumber(phoneNumber);

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
              text: taskData.title
            },
            {
              type: 'text',
              text: taskData.description || 'لا توجد تفاصيل'
            },
            {
              type: 'text',
              text: taskData.due_date
            }
          ]
        }
      ]
    }
  };

  return await sendWhatsAppRequest(body);
}

module.exports = {
  sendWhatsAppMessage,
  sendTaskNotification
};*/
/*
*العنوان:* {{task_title}}
*التفاصيل:* {{task_description}}
*تاريخ التسليم:* {{task_date}}
*يرجى تسجيل الدخول للنظام لعرض المهمة كاملة*
*/

async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;

    const body = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: {
        body: message
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
                parameter_name: 'task_description',
                text: taskData.description || 'لا توجد تفاصيل'
              },
              {
                type: 'text',
                parameter_name: 'task_date',
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
  sendWhatsAppMessage,
  sendTaskNotification
};