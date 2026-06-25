const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.lolipop.jp',
  port: 465,
  secure: true,
  auth: {
    user: 'info@style-association.jp',
    pass: process.env.SMTP_PASS
  }
});

function buildAutoReply(name, company, email, tel, category, message) {
  const salutation = name ? `${name} 様` : 'お客様';
  const msgLines = message ? message.split('\n').map(l => ` ${l}`).join('\n') : ' （未記入）';
  return `${salutation}

平素は格別のご愛顧を賜り、厚く御礼申し上げます。
協同組合スタイルアソシエーションです。

この度は、弊組合ホームページよりお問い合わせいただきまして、誠にありがとうございます。

本メールは、お問い合わせを受け付けたことをお知らせする自動配信メールです。
送信いただいた内容は以下の通りです。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ お問い合わせ内容の確認
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
・お名前：${name || '（未記入）'} 様
・貴社名：${company || '（未記入）'}
・メールアドレス：${email}
・電話番号：${tel || '（未記入）'}
・お問い合わせ種別：${category || '（未選択）'}
・ご相談内容：
${msgLines}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

内容を確認の上、担当者より[ 2〜3営業日 ]以内に折り返しご連絡を差し上げます。
今しばらくお待ちいただけますようお願い申し上げます。

なお、数日経過しても返信がない場合や、お急ぎの場合は、
大変お手数ですが下記のお問い合わせ窓口までご連絡ください。

※本メールに心当たりがない場合は、誠に恐れ入りますが、
 本メールを破棄していただきますようお願いいたします。

--------------------------------------------------
協同組合スタイルアソシエーション
〒710-0845 岡山県倉敷市鶴の浦3-2-1
TEL：086-454-4884（受付時間：平日 9:00〜17:00）
E-mail：info@style-association.jp
URL：https://www.style-association.jp/
--------------------------------------------------`;
}

function buildNotification(name, company, email, tel, category, message) {
  return `【Webサイト お問い合わせ通知】

お名前：${name || '（未記入）'}
会社名：${company || '（未記入）'}
メールアドレス：${email}
電話番号：${tel || '（未記入）'}
お問い合わせ種別：${category || '（未選択）'}

ご相談内容：
${message || '（未記入）'}`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { name, company, email, tel, category, message } = req.body || {};

  if (!email || !message) {
    return res.status(400).json({ success: false, message: 'メールアドレスとご相談内容は必須です。' });
  }

  try {
    await transporter.sendMail({
      from: '"Webフォーム通知" <info@style-association.jp>',
      to: 'info@style-association.jp',
      replyTo: email,
      subject: `【お問い合わせ】${company ? company + ' ' : ''}${name || ''}様より`,
      text: buildNotification(name, company, email, tel, category, message)
    });

    await transporter.sendMail({
      from: '"協同組合スタイルアソシエーション" <info@style-association.jp>',
      to: email,
      subject: '【自動返信】お問い合わせありがとうございます',
      text: buildAutoReply(name, company, email, tel, category, message)
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Mail error:', err.message);
    res.status(500).json({ success: false, message: '送信に失敗しました。' });
  }
};
