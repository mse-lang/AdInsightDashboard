import { Home, Users, FileText, BarChart3, Settings, Mail, Calendar, Receipt, Briefcase, Inbox } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import logoImage from "@assets/venturesquare logo_로고만_1761404131673.png";

const menuItems = [
  { title: "대시보드", url: "/", icon: Home },
  { title: "광고 문의", url: "/inquiries", icon: Inbox },
  { title: "광고주 관리", url: "/advertisers-airtable", icon: Users },
  { title: "견적 관리", url: "/quotes-airtable", icon: FileText },
  { title: "세금계산서", url: "/invoices", icon: Receipt },
  { title: "캠페인 관리", url: "/campaigns", icon: Briefcase },
  { title: "광고 캘린더", url: "/calendar", icon: Calendar },
  { title: "성과 분석", url: "/analytics", icon: BarChart3 },
  { title: "광고소개서", url: "/materials", icon: Mail },
  { title: "설정", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="Venture Square" className="w-10 h-10 rounded-md" />
          <div>
            <h2 className="font-bold text-lg">벤처스퀘어</h2>
            <p className="text-xs text-muted-foreground">광고 관리</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title}`}>
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
