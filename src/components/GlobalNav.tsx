import { icons } from '../utils/icons';

// Icon assets - using local icons
const imgHome = icons.HomeOutline;
const imgUserPlus = icons.ProvisionUsersOnboardOutline;
const imgUserMinus = icons.ProvisionUsersOffboardOutline;
// Divider - using CSS border instead of icon
// Divider removed - using CSS border instead
const imgStarOutline = icons.StarOutline;
const imgTimeOutline = icons.TimeOutline;
const imgSearch = icons.SearchOutline;
const imgDepartment = icons.DepartmentsOutline
const imgPayrollOutline = icons.PayrollOutline;
const imgCreditCardOutline = icons.CreditCardOutline;
const imgTalentOutline = icons.TalentOutline;
const imgITOutline = icons.ItOutline;
const imgServerOutline = icons.ServerOutline;
const imgCustomAppsOutline = icons.CustomAppsOutline;
const imgToolsOutline = icons.ToolsOutline;
const imgCompanySettingsOutline = icons.CompanySettingsOutline;
const imgHelpOutline = icons.HelpOutline;
const imgBriefcase = icons.BriefcaseOutline;
const imgUsers = icons.UsersOutline;
const imgUsersOutline = icons.UsersOutline;
const imgHeart = icons.HeartOutline;
const imgMonitor = icons.LaptopOutline;
const imgApps = icons.AppsOutline;
const imgDollarSign = icons.Dollar;
const imgGlobe = icons.GlobeOutline;
const imgAppShop = icons.AppsOutline; // Using Apps as App Shop
const imgHelpCircle1 = icons.QuestionCircleFilled; // Using Question Circle for Help
const imgHelpCircle2 = icons.QuestionCircleFilled; // Simplified - using same icon
const imgHelpCircle3 = icons.QuestionCircleFilled; // Simplified - using same icon
const imgSettings = icons.SettingsOutline;

interface GlobalNavProps {
  activeItem?: string;
  onNavigate?: (route: string) => void;
  panelWidth?: number; // Width of the side panel when open (for responsive layout)
}

interface NavItem {
  id: string;
  icon: string | { main: string; parts?: string[] };
  label: string;
}

const topNavItems: NavItem[] = [
  { id: 'home', icon: imgHome, label: 'Home' },
  { id: 'user-plus', icon: imgUserPlus, label: 'Add User' },
  { id: 'user-minus', icon: imgUserMinus, label: 'Remove User' },
  { id: 'org-chart', icon: imgDepartment, label: 'Org Chart' },
  { id: 'star', icon: imgStarOutline, label: 'Star' },
  { id: 'time', icon: imgTimeOutline, label: 'Time' },
  { id: 'heart', icon: imgHeart, label: 'Heart' },
  { id: 'payroll', icon: imgPayrollOutline, label: 'Payroll' },
  { id: 'finance', icon: imgCreditCardOutline, label: 'Finance' },
  { id: 'talent', icon: imgTalentOutline, label: 'Talent' },
  { id: 'IT', icon: imgITOutline, label: 'IT' },
  { id: 'HR', icon: imgUsersOutline, label: 'HR' },
  { id: 'Data', icon: imgServerOutline, label: 'Data' },
  { id: 'Custom-app', icon: imgCustomAppsOutline, label: 'Custom Apps' },

];

const bottomNavItems: NavItem[] = [
  

  { id: 'Tools', icon: imgToolsOutline, label: 'Tools' },
  { id: 'Company-settings', icon: imgCompanySettingsOutline, label: 'Company Settings' },
  { id: 'app-shop', icon: imgAppShop, label: 'App Shop' },
  { id: 'Help', icon: imgHelpOutline, label: 'Help' },
];

function NavIcon({ icon, itemId }: { icon: string | { main: string; parts?: string[] }; itemId: string }) {
  if (typeof icon === 'string') {
    // Handle icons with specific positioning requirements
    if (itemId === 'user-plus' || itemId === 'user-minus') {
      return (
        <div className="relative shrink-0 w-6 h-6 flex items-center justify-center">
          <img 
            alt="" 
            className="block" 
            src={icon}
            style={{ width: '24px', height: '24px' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      );
    }
    
    if (itemId === 'star') {
      return (
        <div className="relative shrink-0 w-6 h-6 flex items-center justify-center">
          <img 
            alt="" 
            className="block" 
            src={icon}
            style={{ width: '24px', height: '24px' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      );
    }
    
    if (itemId === 'users') {
      return (
        <div className="relative shrink-0 w-6 h-6 flex items-center justify-center">
          <img 
            alt="" 
            className="block" 
            src={icon}
            style={{ width: '24px', height: '24px' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      );
    }
    
    // Default rendering for other simple icons
    return (
      <div className="relative shrink-0 w-6 h-6 flex items-center justify-center">
        <img 
          alt="" 
          className="block" 
          src={icon}
          style={{ width: '24px', height: '24px' }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Handle composite icons (like help-circle)

  if (itemId === 'help-circle' && icon.parts) {
    return (
      <div className="relative shrink-0 w-6 h-6 overflow-clip">
        <div className="absolute inset-[4.167%]">
          <img 
            alt="" 
            className="block max-w-none w-full h-full" 
            src={icon.main}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
        <div className="absolute inset-[24.98%_33.67%_41.67%_33.71%]">
          <img 
            alt="" 
            className="block max-w-none w-full h-full" 
            src={icon.parts[0]}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
        <div className="absolute bottom-1/4 left-[45.83%] right-[45.79%] top-[66.67%]">
          <img 
            alt="" 
            className="block max-w-none w-full h-full" 
            src={icon.parts[1]}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative shrink-0 w-6 h-6 flex items-center justify-center">
      <img 
        alt="" 
        className="block" 
        src={icon.main}
        style={{ width: '24px', height: '24px' }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    </div>
  );
}

export default function GlobalNav({ activeItem = 'home', onNavigate, panelWidth = 0 }: GlobalNavProps) {
  const handleItemClick = (itemId: string) => {
    if (onNavigate) {
      if (itemId === 'user-plus') {
        onNavigate('/start-hiring');
      } else {
        onNavigate(`/${itemId === 'home' ? '' : itemId}`);
      }
    }
  };

  return (
    <nav className="fixed left-0 top-[82px] bottom-0 w-16 bg-white border-r border-[#e3e3e3] z-40 flex flex-col">
      {/* Top Navigation Items */}
      <div className="flex flex-col gap-1 items-start px-3.5 py-3 flex-1 overflow-y-auto">
        {topNavItems.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`flex gap-0.5 items-center justify-center rounded transition-colors ${
                isActive 
                  ? 'bg-[#f2f2f2]' 
                  : 'bg-white hover:bg-gray-50'
              }`}
              style={{ width: '40px', height: '40px' }}
              title={item.label}
            >
              <NavIcon icon={item.icon} itemId={item.id} />
            </button>
          );
        })}

        
      </div>

      {/* Bottom Navigation Items - Float to bottom */}
      <div className="flex flex-col gap-1 items-start px-3.5 py-3 shrink-0 mt-auto">
        {/* Divider */}
        <div className="flex flex-col gap-3 items-start px-0 py-3 shrink-0 w-full">
          <div className="h-px w-full bg-gray-300 shrink-0" />
        </div>

        {bottomNavItems.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`flex gap-0.5 items-center justify-center rounded transition-colors ${
                isActive 
                  ? 'bg-[#f2f2f2]' 
                  : 'bg-white hover:bg-gray-50'
              }`}
              style={{ width: '40px', height: '40px' }}
              title={item.label}
            >
              <NavIcon icon={item.icon} itemId={item.id} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
