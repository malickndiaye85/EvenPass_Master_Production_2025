export interface TicketFooterProps {
  supportPhone?: string;
  contactEmail?: string;
}

export default function TicketFooter({
  supportPhone = '+221 77 123 45 67',
  contactEmail = 'support@evenpass.sn',
}: TicketFooterProps) {
  return (
    <div className="bg-gradient-to-r from-[#0F0F0F] to-[#1A1A1A] border-t-2 border-[#FF6B35] px-6 py-4 mt-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4 text-[#B5B5B5]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Support:</span>
            <a
              href={`tel:${supportPhone}`}
              className="text-[#FF6B35] hover:text-[#FF8C5A] transition-colors font-medium"
            >
              {supportPhone}
            </a>
          </div>
          <span className="hidden md:inline text-[#3A3A3A]">|</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Contact:</span>
            <a
              href={`mailto:${contactEmail}`}
              className="text-[#FF6B35] hover:text-[#FF8C5A] transition-colors font-medium"
            >
              {contactEmail}
            </a>
          </div>
        </div>
        <div className="text-[#B5B5B5] text-center md:text-right">
          © 2026 <span className="text-white font-semibold">EvenPass</span> - Tous droits réservés
        </div>
      </div>
    </div>
  );
}

export function TicketFooterCompact() {
  return (
    <div className="text-center py-2 px-4 text-[10px] text-gray-600 border-t border-gray-300">
      <p className="font-medium">
        Support: +221 77 123 45 67 | Contact: support@evenpass.sn
      </p>
      <p className="mt-1">© 2026 EvenPass - Tous droits réservés</p>
    </div>
  );
}
