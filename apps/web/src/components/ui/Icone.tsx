import {
  Baby,
  BookOpen,
  Download,
  MessageCircle,
  Paperclip,
  Send,
  BedDouble,
  ChartColumn,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Droplet,
  Eye,
  FileText,
  Flame,
  Funnel,
  Gavel,
  Hammer,
  Heart,
  House,
  Info,
  LayoutGrid,
  Link as LinkIcon,
  Lock,
  LogOut,
  MapPin,
  Medal,
  Megaphone,
  Menu,
  Minus,
  MoreVertical,
  Package,
  Pause,
  PawPrint,
  Pencil,
  Play,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sofa,
  Sparkles,
  Star,
  Store,
  Tag,
  Trash2,
  TriangleAlert,
  Truck,
  Upload,
  User,
  Volleyball,
  X,
  type LucideIcon,
} from 'lucide-react';

/**
 * Nomes semânticos dos ícones (os mesmos do protótipo) → lucide-react.
 * Trocar a biblioteca de ícones no futuro = mexer só aqui.
 */
const MAPA = {
  search: Search,
  bag: ShoppingBag,
  user: User,
  home: House,
  grid: LayoutGrid,
  pin: MapPin,
  heart: Heart,
  chevR: ChevronRight,
  chevL: ChevronLeft,
  chevD: ChevronDown,
  x: X,
  plus: Plus,
  minus: Minus,
  moreVertical: MoreVertical,
  check: Check,
  truck: Truck,
  store: Store,
  shield: ShieldCheck,
  lock: Lock,
  star: Star,
  fire: Flame,
  tag: Tag,
  menu: Menu,
  card: CreditCard,
  box: Package,
  chart: ChartColumn,
  megaphone: Megaphone,
  receipt: Receipt,
  link: LinkIcon,
  refresh: RefreshCw,
  eye: Eye,
  upload: Upload,
  logout: LogOut,
  clock: Clock,
  gavel: Gavel,
  info: Info,
  alert: TriangleAlert,
  doc: FileText,
  copy: Copy,
  trash: Trash2,
  edit: Pencil,
  filter: Funnel,
  sparkle: Sparkles,
  medal: Medal,
  play: Play,
  pause: Pause,
  // categorias
  shirt: Shirt,
  hammer: Hammer,
  bed: BedDouble,
  sofa: Sofa,
  cart: ShoppingCart,
  phone: Smartphone,
  ball: Volleyball,
  drop: Droplet,
  baby: Baby,
  paw: PawPrint,
  book: BookOpen,
  download: Download,
  chat: MessageCircle,
  clip: Paperclip,
  send: Send,
} satisfies Record<string, LucideIcon>;

export type NomeIcone = keyof typeof MAPA;

const TAMANHO = { sm: 16, md: 20, lg: 26 } as const;

export function Icone({
  nome,
  tamanho = 'md',
  className,
  strokeWidth = 1.9,
}: {
  nome: NomeIcone;
  tamanho?: keyof typeof TAMANHO;
  className?: string;
  strokeWidth?: number;
}) {
  const C = MAPA[nome];
  return (
    <C
      size={TAMANHO[tamanho]}
      strokeWidth={strokeWidth}
      className={`flex-none ${className ?? ''}`}
      aria-hidden
    />
  );
}
