import React, { useEffect, useState } from "react";

const BRAND = "CEX";
const CONTACT_EMAIL = "support@example.com";

const DOCS = [
  {
    id: "upgrade",
    title: "System Upgrade Announcement",
    blocks: [
      [
        "Announcement: The platform has completed the system upgrade. Please change your password in time to ensure account security!",
      ],
    ],
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    blocks: [
      [
        "I. Subject",
        `This Privacy Policy explains how ${BRAND} collects, uses, shares, and protects user information obtained through the website. "We" herein refers to ${BRAND} and its affiliated companies. When collecting personal information from users, we do so for the purpose of providing services, complying with laws, regulations, and supervisory policies, as well as other specific needs. For non-essential information, you have the right to decide whether to provide it; however, missing non-essential information may result in the inability to use certain permission s and functions of this website. By using this website, you agree to all the contents of this Privacy Policy.`,
        "We will adjust this Privacy Policy from time to time according to changes in laws and regulations or methods of personal data collection and usage. Announcements of modifications to the Privacy Policy will be published on the official website. If your information is to be used for purposes not covered in this Privacy Policy, we will notify you in advance and obtain your consent.",
        `For convenience, ${BRAND} and this website are collectively referred to as "we" or other first-person pronouns in this agreement.`,
        `Any natural person or other entity that logs in, visits, or uses this website and its services shall be deemed a user of this website. For convenience, such user will be referred to as "you" or other second-person pronouns.`,
        `For convenience, both parties are collectively referred to as "the Parties" in this Privacy Policy, while individually referred to as "a Party."`,
      ],
      [
        "II. Purpose of the Privacy Policy",
        "This Privacy Policy stipulates the types of personal information we collect through your login, registration, and/or use of our services on this website, as well as how we use and protect the collected information.",
      ],
      [
        "III. Your Consent",
        "To ensure your full confidence in how we handle your personal information, please carefully read and understand the provisions of this Privacy Policy. Once you log in to our website, regardless of whether you register on it, you signify your acceptance, agreement, commitment, and confirmation that:",
        "3.1 You voluntarily disclose personal information to us with the necessary consent;",
        "3.2 You will comply with all the contents and restrictions of this Privacy Policy;",
        "3.3 You agree that we collect your information through your login, registration, and/or use of our services;",
        "3.4 You agree to any future modifications of this Privacy Policy;",
        "3.5 You agree to be contacted by our branches, subsidiaries, affiliates, and employees regarding products and services you may be interested in (unless you have explicitly opted out of receiving such communications).",
      ],
      [
        "IV. Information Collected",
        "4.1 When you use this website, you agree that we may use cookies to track your actions and collect and retain information, including but not limited to your IP address, geographic location, and other data.",
        "4.2 If you wish to use the services provided by this website, you must provide the following two types of information:",
        `4.2.1 Identity Information: Information that helps us verify your eligibility to register as a member of this website, including but not limited to your name, residential address, mailing address, country of residence, government-issued identification documents and numbers, and other details that verify your identity ("Identity Information").`,
        `4.2.2 Service Information: Information that helps us contact you and provide services, including but not limited to your phone number, fax number, valid email address, mailing address, debit card details, and/or other account information ("Service Information").`,
        "4.3 While using this website or its services, we may collect additional necessary information to improve functionality, enhance security, or comply with court orders, applicable laws, regulations, or competent government authority requests.",
        "4.4 If you visit any third-party links displayed on this website or by our partners, you agree to comply with their independent privacy policies. We are not responsible for the content or activities of third-party websites or partners.",
      ],
      [
        "V. Cookies",
        "5.1 When you visit our website, we use cookies with Google Stats to record performance and verify online advertising effectiveness. Cookies are small data files sent to your browser and stored on your hard drive. They can only be sent when you access our website from your computer.",
        "5.2 Cookies are often used to record visitors' browsing habits and preferences on our site. Data collected is anonymous aggregated statistical information, not personal data.",
        "5.3 Cookies cannot retrieve data from your hard drive, your email address, or your private data. They simply allow the system to recognize your browser and capture information. Most browsers are set to accept cookies by default. You may choose to disable cookies or be notified when cookies are placed. However, disabling cookies may prevent you from using certain functions of this website.",
      ],
      [
        "VI. Purposes of Using Information",
        "6.1 We use the information collected for the following purposes:",
        "6.1.1 To provide services through our website;",
        "6.1.2 To identify and verify your identity when using the website;",
        "6.1.3 To improve and enhance services based on your information and feedback;",
        "6.1.4 To compile website usage statistics and conduct data analysis in cooperation with government agencies and institutions;",
        "6.1.5 To personalize your user experience;",
        "6.1.6 To process transactions (your information will not be sold, exchanged, transferred, or given to other companies without consent, except to fulfill the specific purpose of the requested transaction);",
        "6.1.7 To send periodic emails regarding orders, updates, products, or services;",
        "6.1.8 To fulfill purposes set forth in the User Agreement and all lawful means necessary for such purposes.",
        "6.2 We will not sell, trade, or otherwise transfer your information or allow others to use it, except: affiliates, trusted third parties assisting us in operating the website or providing services (who must keep the information confidential), or when disclosure is necessary to comply with laws, enforce website policies, maintain security, or protect rights and property. Your information will never be used for marketing, advertising, or other profit-making purposes by unrelated third parties.",
      ],
      [
        "VII. Protection of Personal Data",
        "7.1 We implement appropriate physical, electronic, administrative, and technical measures to protect your personal information. These include:",
        "7.1.1 Physical Measures: Proper storage of physical media containing your data, with access restrictions.",
        "7.1.2 Electronic Measures: Data stored on computer systems with strict access controls.",
        "7.1.3 Administrative Measures: Only authorized staff may access personal information, bound by internal confidentiality rules.",
        "7.1.4 Technical Measures: Encryption technologies such as SSL may be used to transmit information.",
        "7.1.5 Other Measures: Our servers are protected by firewalls.",
        "7.2 If you discover any security vulnerabilities on our site, please contact us immediately so that we may take corrective action.",
        "7.3 Despite these safeguards, we cannot guarantee absolute security of data transmitted over the internet. We are not responsible for any unauthorized access to your personal information or resulting damages.",
      ],
      [
        "VIII. Amendments to the Privacy Policy",
        "We reserve the right to modify this Privacy Policy at any time. Updated versions and effective dates will be posted on our website. Although we may occasionally provide notices of revisions, this is not obligatory. You should review the Privacy Policy regularly. If you do not agree with modifications, you should stop using the website immediately. Continued use after updates indicates acceptance of the revised Privacy Policy.",
      ],
      [
        "IX. Communication with Us",
        `9.1 If you have any requests or comments, you may contact us at ${CONTACT_EMAIL}. This is the only official and valid email for communication. We are not responsible for issues caused by using invalid contact methods.`,
        "9.2 We only publish announcements and information via official contacts listed on this website. We are not responsible for losses from information obtained through unofficial channels.",
        "9.3 If you have any questions about this Privacy Policy, please feel free to contact us.",
      ],
    ],
  },
  {
    id: "legal",
    title: "Legal Statement",
    blocks: [
      [
        "Article 1",
        "The purpose of this Exchange is to provide a professional, international-level trading platform and financial products for global digital asset enthusiasts and investors, under the premise of not violating relevant laws and regulations. The use of this Exchange for money laundering, smuggling, commercial bribery, terrorist financing, or any other illegal trading activities is strictly prohibited. If such activities are discovered, the Exchange reserves the right to immediately freeze the account and report it to the regulatory authorities.",
        "Article 2",
        "When regulatory authorities present the relevant investigative documents requiring this website to cooperate in investigating designated users, or to take compulsory measures such as sealing, freezing, or transferring user accounts, the Exchange will assist in providing the relevant user data or carrying out the necessary actions as required by the authorities. The Exchange shall not bear any responsibility for any resulting disclosure of user privacy, inability to operate accounts, or any losses arising therefrom.",
        "Article 3",
        "If users of this Exchange violate the provisions of this statement and thereby contravene relevant laws, the Exchange, as the service provider, is obligated to improve the rules and services of the platform. However, the Exchange has neither the intent nor the fact of violating laws, and shall not bear any joint liability for the actions of the users.",
        "Article 4",
        "Anyone who logs into this Exchange in any way, or directly or indirectly uses the services of this Exchange, shall be deemed to have voluntarily accepted the constraints of this statement.",
        "Article 5",
        "For matters not covered in this statement, please refer to the relevant laws and regulations. In the event of a conflict between this statement and applicable laws and regulations, the latter shall prevail.",
      ],
    ],
  },
  {
    id: "law",
    title: "Law Enforcement Requests",
    blocks: [
      [
        `${BRAND} occasionally receives requests from law enforcement agencies worldwide for customer information. This section provides guidance for both you and law enforcement agencies on how such requests are handled.`,
        "Law enforcement authorities are typically interested in two types of data: information about customer identity and information regarding their transaction activities. We actively cooperate with law enforcement agencies and respond only to requests made by duly authorized law enforcement personnel who provide valid authorization documents.",
        `In accordance with our Terms of Service, Privacy Policy, and applicable laws, ${BRAND} discloses account information records to international law enforcement authorities.`,
        `${BRAND} requires that law enforcement requests be accompanied by the appropriate legal process to enable us to provide the requested information.`,
        `${BRAND} welcomes inquiries from law enforcement agencies regarding its policies and procedures. Please feel free to contact us.`,
        "When submitting a law enforcement request, please include the following:",
        "Name of the law enforcement agency;",
        "Proof of authorization for the officer to obtain the requested information (authorization document);",
        "Officer's identification (official agency-issued ID);",
        "Investigation request letter issued by the law enforcement agency;",
        "Government domain email address;",
        "Clear identification of the legal entity to which the requested information pertains;",
        "Specific details of the customer information being requested;",
        "Other relevant details, including a reasonable deadline for response and, in the case of international law enforcement agencies, judicial documents required under applicable mutual legal assistance treaties (MLATs).",
        `${BRAND} reserves the right to disclose information to law enforcement agencies in order to protect itself and its customers.`,
      ],
    ],
  },
  {
    id: "protocol",
    title: "Protocol Disclaimer",
    blocks: [
      [
        `By using ${BRAND} and/or its related services, you expressly acknowledge and agree that:`,
        `No individual or entity involved in the creation or operation of ${BRAND} shall be liable for any claims or damages arising from your use of, inability to use, or interactions with other users through the platform, including but not limited to any direct, indirect, incidental, special, exemplary, punitive, or consequential damages, or any loss of profits, digital assets, or other items of value;`,
        "Your use of the platform may require you to pay fees, such as network fees and other costs necessary to execute transactions;",
        "Your use of the platform involves various risks, including but not limited to:",
        "(a) the risk of loss of digital assets provided to the platform; and",
        "(b) the risk of loss resulting from fluctuations in the prices of digital assets in trading pairs;",
        "Before using the platform, you should review the relevant documentation to ensure you understand how it operates;",
        "You are solely responsible for conducting due diligence on the services you access, including understanding the associated fees and risks;",
        "You are responsible for ensuring that your account contains sufficient balances of digital assets to complete any transaction you initiate;",
        "The regulatory framework governing transactions involving digital assets remains uncertain and continues to evolve, and:",
        "(a) any transactions conducted through the platform, as well as any funds earned, lost, or exchanged, may now or in the future be subject to various reporting, tax, or other obligations and liabilities;",
        "(b) legislative and regulatory changes or actions at the national or international level may adversely affect the use, transfer, exchange, and value of your digital assets.",
        "The platform and its services are provided \"as is\", at your own risk, and without warranties of any kind.",
      ],
    ],
  },
  {
    id: "aml",
    title: "Anti-Money Laundering (AML) Agreement",
    blocks: [
      [
        "1. Introduction",
        "1.1 We guarantee to prudently comply with all laws and regulations relating to Know Your Customer (KYC) and Anti-Money Laundering (AML), and we will not intentionally violate these KYC and AML policies. Within the scope of our reasonable control, we adopt the necessary financial measures and technologies to provide you with secure services and to minimize the risk of losses caused by criminal suspects engaging in money laundering.",
        "1.2 Our KYC and AML policy is a comprehensive international compliance framework that incorporates KYC and AML policies across different jurisdictions to which you may belong. Our robust compliance system ensures that we meet regulatory requirements both locally and globally, and guarantees the sustainable operation of this website.",
      ],
      [
        "2. KYC and AML Policy",
        "2.1 Issue and continuously update our KYC and AML policy to meet the standards required by relevant laws and regulations.",
        "2.2 Establish and update guidelines and rules for the operation of this website. Our employees will provide services in accordance with these principles and rules.",
        "2.3 Design and implement internal monitoring and transaction control procedures, such as strict identity verification and the establishment of a professional team dedicated to AML tasks.",
        "2.4 Adopt a risk-based approach to conduct due diligence on customers and maintain ongoing monitoring.",
        "2.5 Review and periodically audit transactions.",
        "2.6 Report suspicious transactions to the competent authorities.",
        "2.7 Identity documents, address verification documents, and transaction records will be retained for at least six years, and may be submitted to regulators without prior notice to you.",
        "2.8 The use of credit cards is strictly prohibited throughout the transaction process.",
        "2.9 Regularly participate in training sessions organized by relevant authorities and provide periodic training to employees.",
      ],
      [
        "3. Identity Information and Verification",
        "3.1 Identity Information",
        "3.1.1 For individuals:",
        "Depending on the jurisdiction and entity type, the information collected may vary. As a general principle, for individual registrants we will collect:",
        "Personal basic information: name, residential address (and permanent address if different), date of birth, nationality, and other available details. Identity verification must be based on documents issued by official or equivalent authoritative institutions, such as passports, identity cards, or other documents required by applicable jurisdictions. The provided address will be verified through appropriate methods, such as checking public records, utility bills, or voter registration lists.",
        "Valid photograph: Before registration, you must provide a photo of yourself holding your identification document against your chest.",
        "Contact information: phone/mobile number and a valid email address.",
        "3.1.2 For companies or other legal entities:",
        "We will collect the following information to identify the entity and its ultimate beneficial owners:",
        "Company registration and incorporation certificate;",
        "Articles of association and memorandum of association;",
        "Detailed proof of shareholding structure and ownership, including board resolutions authorizing the opening and operation of accounts on this website;",
        "Identification documents for directors, major shareholders, and authorized signatories;",
        "Primary business address, and if different, mailing address. Where a local address differs from the principal business address, the entity will be considered high-risk and must provide additional supporting documentation.",
        "Other certifications and documents issued by competent authorities as required by different jurisdictions, and any other documents deemed necessary.",
        "3.1.3 We only accept identity information in English or Chinese. If not, you must provide a notarized English translation of your identity documents.",
        "3.2 Verification",
        "3.2.1 You are required to provide both the front and back copies of your identification document.",
        "3.2.2 You must provide a photograph of yourself holding your identification document against your chest.",
        "3.2.3 Copies of documents should generally be verified against the original. However, if a trusted and appropriate certifier confirms that the copy is a true and complete reproduction of the original, such certified copies are acceptable. Acceptable certifiers include ambassadors, judicial officers, magistrates, or similar officials.",
        "3.2.4 Requirements for identifying ultimate beneficial owners and account controllers include determining which individuals ultimately own or control the direct client and/or identifying whether transactions are being executed on behalf of others. For corporate entities, the identities of major shareholders must be verified:",
        "Shareholders holding 25% or less of voting rights are generally considered normal risk and must be verified.",
        "Shareholders holding 10% or more of voting rights or shares are considered higher risk and must be verified with enhanced due diligence.",
      ],
      [
        "4. Transaction Monitoring",
        "4.1 We set and adjust daily transaction and withdrawal limits based on security considerations and actual trading activity.",
        "4.2 If transactions appear unusually frequent or concentrated in a particular account, or exceed reasonable expectations, our professional team will assess whether they are suspicious.",
        "4.3 Transactions deemed suspicious by our own judgment may be suspended, rejected, or reversed as soon as possible. We may also report such transactions to the competent authorities without prior notice to you.",
        "4.4 We reserve the right to reject account applications from persons in jurisdictions that do not meet international AML standards or from individuals considered politically exposed persons (PEPs). We also reserve the right to suspend or terminate any transaction we deem suspicious at our sole discretion, without incurring any liability or obligation to you.",
      ],
      [`${BRAND} Team`],
    ],
  },
  {
    id: "license",
    title: "Licensing & Compliance",
    blocks: [
      [
        "Licensing and compliance information will be published here.",
      ],
    ],
  },
];

const BackIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

const ArrowIcon = ({ dir }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={dir === "l" ? { transform: "scaleX(-1)" } : undefined}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
);

const CSS = `
.cx-in-pg{--bg:#f3f5fa;--bar:#ffffff;--card:#ffffff;--fg:#1a2230;--fg2:rgba(26,34,48,.55);--ln:rgba(0,0,0,.14);--ov:rgba(10,16,28,.55);--mod:#ffffff;
  background:var(--bg);color:var(--fg);min-height:100vh;box-sizing:border-box;padding-bottom:32px}
.cx.dark .cx-in-pg,.cx-in-pg.dk{--bg:#0b1520;--bar:#101f30;--card:#101f30;--fg:#ffffff;--fg2:rgba(255,255,255,.55);--ln:rgba(255,255,255,.22);--ov:rgba(2,6,12,.72);--mod:#101f30}

.cx-in-pg .cx-in-top{position:sticky;top:0;z-index:5;display:grid;grid-template-columns:48px 1fr 48px;align-items:center;height:46px;
  background:var(--bar);border-bottom:1px solid var(--ln)}
.cx-in-pg .cx-in-top h1{margin:0;font-size:16px;font-weight:500;text-align:center;color:var(--fg)}
.cx-in-pg .cx-in-top button{height:46px;display:grid;place-items:center;background:none!important;border:0!important;color:var(--fg)!important;cursor:pointer;padding:0}

.cx-in-pg .cx-in-list{margin:10px 10px 0;padding:0 26px;border-radius:14px;background:var(--card)}
.cx-in-pg .cx-in-item{display:flex!important;align-items:center;justify-content:space-between;gap:10px;width:100%;height:44px;padding:0!important;
  background:none!important;border:0!important;border-bottom:1px solid var(--ln)!important;border-radius:0!important;
  color:var(--fg)!important;font-size:14px;text-align:start!important;cursor:pointer}
.cx-in-pg .cx-in-item:last-child{border-bottom:0!important}
.cx-in-pg .cx-in-item .l{display:flex;align-items:center;gap:6px;min-width:0}
.cx-in-pg .cx-in-item .l span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cx-in-pg .cx-in-item .r{color:var(--fg2);flex:none;display:grid;place-items:center}
.cx-in-pg .cx-in-item:active{opacity:.7}

.cx-in-ov{position:fixed;inset:0;z-index:300;background:var(--ov);display:flex;align-items:center;justify-content:center;padding:16px;
  -webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}
.cx-in-md{position:relative;width:100%;max-width:1100px;max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);display:flex;flex-direction:column;
  background:var(--mod);color:var(--fg);border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.45);overflow:hidden;box-sizing:border-box}
.cx-in-md .cx-in-x{position:absolute;top:10px;right:12px;z-index:2;width:34px;height:34px;display:grid;place-items:center;
  background:none!important;border:0!important;color:var(--fg)!important;opacity:.85;cursor:pointer;padding:0}
.cx-in-md h2{margin:0;padding:48px 52px 14px;font-size:16px;font-weight:500;text-align:center;color:var(--fg);flex:none}
.cx-in-md .cx-in-body{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;padding:0 12px 18px;font-size:13px;line-height:1.5;color:var(--fg)}
.cx-in-md .cx-in-blk{padding:2px 0;border-bottom:1px solid var(--fg)}
.cx-in-md .cx-in-blk:last-child{border-bottom:0}
.cx-in-md .cx-in-blk p{margin:0;overflow-wrap:anywhere}

@media(min-width:900px){
  .cx-in-pg .cx-in-list{margin:12px 16px 0}
  .cx-in-md .cx-in-body{padding:0 12px 20px}
}
`;

export default function Introduction({ go }) {
  const [openId, setOpenId] = useState("");
  const doc = DOCS.find((d) => d.id === openId) || null;

  useEffect(() => {
    if (!doc) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpenId(""); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [doc]);

  return (
    <div className="cx-in-pg">
      <style>{CSS}</style>

      <div className="cx-in-top">
        <button type="button" onClick={() => go("home")} aria-label="Back"><BackIcon /></button>
        <h1>Website Introduction</h1>
        <span />
      </div>

      <div className="cx-in-list">
        {DOCS.map((d) => (
          <button key={d.id} type="button" className="cx-in-item" onClick={() => setOpenId(d.id)}>
            <span className="l"><ArrowIcon /><span>{d.title}</span></span>
            <span className="r"><ArrowIcon /></span>
          </button>
        ))}
      </div>

      {doc && (
        <div className="cx-in-ov" onClick={() => setOpenId("")}>
          <div className="cx-in-md" role="dialog" aria-modal="true" aria-label={doc.title} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="cx-in-x" onClick={() => setOpenId("")} aria-label="Close"><CloseIcon /></button>
            <h2>{doc.title}</h2>
            <div className="cx-in-body">
              {doc.blocks.map((blk, i) => (
                <div className="cx-in-blk" key={i}>
                  {blk.map((line, j) => <p key={j}>{line}</p>)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
