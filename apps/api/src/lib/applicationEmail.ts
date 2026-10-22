const receivedAtFormat = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  dateStyle: "long",
  timeStyle: "short",
});

export function buildApplicationReceivedEmail(params: {
  fullName: string;
  inquiryNumber: string;
  cases: Array<{ title: string; companyName: string }>;
  receivedAt: Date;
}): { subject: string; text: string } {
  const caseLines = params.cases.map((c) => `・${c.title}(${c.companyName})`).join("\n");
  return {
    subject: `【OPTAS】お申し込みを受け付けました(お問い合わせ番号: ${params.inquiryNumber})`,
    text: [
      `${params.fullName} 様`,
      "",
      "このたびはお申し込みいただき、ありがとうございます。",
      "以下の内容でお申し込みを受け付けました。",
      "",
      "■ お問い合わせ番号",
      params.inquiryNumber,
      "",
      "■ お申し込み内容",
      caseLines,
      "",
      "■ 受付日時",
      receivedAtFormat.format(params.receivedAt),
      "",
      "今後は、各サービスの担当企業より、ご登録の連絡先へ順次ご連絡いたします。",
      "お問い合わせの際は、上記のお問い合わせ番号をお伝えください。",
      "",
      "※このメールは送信専用のアドレスからお送りしています。",
      "※お心当たりのない場合は、このメールを破棄してください。",
      "",
      "OPTAS",
    ].join("\n"),
  };
}
