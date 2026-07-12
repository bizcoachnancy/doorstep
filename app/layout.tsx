export const metadata = {
  title: "Doorstep",
  description: "Postcards for people still standing at the property.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
