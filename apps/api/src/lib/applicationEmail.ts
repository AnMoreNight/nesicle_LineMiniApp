const receivedAtFormat = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  dateStyle: "long",
  timeStyle: "short",
});

export function buildApplicationReceivedEmail(params: {
  fullName: string;
  // alreadyApplied: 以前のお申し込みが対応中のため、今回は新しい申込にしなかった案件
  items: Array<{ inquiryNumber: string; title: string; companyName: string; alreadyApplied?: boolean }>;
  receivedAt: Date;
}): { subject: string; text: string } {
  const lines = params.items
    .map((it) => `・${it.inquiryNumber}  ${it.title}(${it.companyName})${it.alreadyApplied ? " ※お申し込み済み" : ""}`)
    .join("\n");
  const newItems = params.items.filter((it) => !it.alreadyApplied);
  const subjectSuffix =
    newItems.length === 1 ? `お問い合わせ番号: ${newItems[0].inquiryNumber}` : `${newItems.length}件`;
  const alreadyNote = params.items.some((it) => it.alreadyApplied)
    ? ["※「お申し込み済み」のサービスは、以前のお申し込みを引き続き受け付けています。", ""]
    : [];
  return {
    subject: `【OPTAS】お申し込みを受け付けました(${subjectSuffix})`,
    text: [
      `${params.fullName} 様`,
      "",
      "このたびはお申し込みいただき、ありがとうございます。",
      "以下の内容でお申し込みを受け付けました。",
      "",
      "■ お問い合わせ番号 / お申し込み内容",
      lines,
      "",
      ...alreadyNote,
      "■ 受付日時",
      receivedAtFormat.format(params.receivedAt),
      "",
      "今後は、各サービスの担当企業より、ご登録の連絡先へ順次ご連絡いたします。",
      "サービス内容についてのご質問は、担当企業からのご連絡の際にお尋ねください。",
      "お問い合わせ番号は、OPTASへお問い合わせいただく際にお伝えください。",
      "",
      "※このメールは送信専用のアドレスからお送りしています。",
      "※お心当たりのない場合は、このメールを破棄してください。",
      "",
      "OPTAS",
    ].join("\n"),
  };
}
