// PostGrid integration — sends a single postcard to a single recipient.
// Docs: https://documentation.postgrid.com/reference/postcards (verify field
// names against current docs before going live; APIs evolve).
//
// NOTE: the "from" address below is YOUR return address (or the realtor's
// office address). Update it per-user once you add a "business address"
// field to onboarding — for now it reads from env as a placeholder default.

const TEMPLATE_COLORS: Record<string, string> = {
  listed: "#B98B3E",
  sold: "#C1442D",
  openhouse: "#2C6E49",
  networking: "#16283D",
  keepsake: "#2C6E49",
};

const TEMPLATE_STAMPS: Record<string, string> = {
  listed: "LISTED",
  sold: "SOLD",
  openhouse: "OPEN HOUSE",
  networking: "HELLO",
  keepsake: "HOME",
};

function buildFrontHtml(photoUrl: string, template: string) {
  const color = TEMPLATE_COLORS[template] ?? "#16283D";
  const stamp = TEMPLATE_STAMPS[template] ?? "";
  return `
    <div style="width:6in;height:4in;position:relative;font-family:sans-serif;overflow:hidden;">
      <img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;" />
      <div style="position:absolute;top:0.2in;right:0.2in;width:0.9in;height:0.9in;
        border:3px solid ${color};border-radius:50%;display:flex;align-items:center;
        justify-content:center;text-align:center;font-size:11px;font-weight:800;
        color:${color};background:rgba(255,255,255,0.85);transform:rotate(-8deg);">
        ${stamp}
      </div>
    </div>`;
}

function buildBackHtml(message: string, signedBy: string) {
  return `
    <div style="width:6in;height:4in;display:flex;font-family:sans-serif;padding:0.3in;box-sizing:border-box;">
      <div style="flex:1.3;padding-right:0.2in;border-right:1px solid #ddd;">
        <p style="font-size:13px;line-height:1.5;color:#16283D;white-space:pre-wrap;">${message}</p>
        ${signedBy ? `<p style="font-size:12px;color:#B98B3E;font-weight:700;margin-top:10px;">— ${signedBy}</p>` : ""}
      </div>
    </div>`;
  // Note: PostGrid handles the mailing address block and postage indicia
  // automatically on the right-hand side of the back — do not draw your
  // own address block over it.
}

export async function sendPostcardViaPostGrid(postcard: {
  photo_url: string;
  template: string;
  message: string;
  signed_by: string | null;
  recipient_name: string;
  street: string;
  apt?: string | null;
  city: string;
  state: string;
  zip: string;
}) {
  const response = await fetch("https://api.postgrid.com/print-mail/v1/postcards", {
    method: "POST",
    headers: {
      "x-api-key": process.env.POSTGRID_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: {
        firstName: postcard.recipient_name,
        addressLine1: postcard.street,
        addressLine2: postcard.apt || undefined,
        city: postcard.city,
        provinceOrState: postcard.state,
        postalOrZip: postcard.zip,
        countryCode: "US",
      },
      from: {
        // Placeholder return address — replace with the realtor's real
        // business address once that field exists on their profile.
        companyName: process.env.DEFAULT_RETURN_NAME || "Doorstep",
        addressLine1: process.env.DEFAULT_RETURN_ADDRESS1 || "",
        city: process.env.DEFAULT_RETURN_CITY || "",
        provinceOrState: process.env.DEFAULT_RETURN_STATE || "",
        postalOrZip: process.env.DEFAULT_RETURN_ZIP || "",
        countryCode: "US",
      },
      size: "6x4",
      frontHTML: buildFrontHtml(postcard.photo_url, postcard.template),
      backHTML: buildBackHtml(postcard.message, postcard.signed_by || ""),
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`PostGrid error (${response.status}): ${errText}`);
  }

  return response.json(); // contains PostGrid's postcard id + status
}
