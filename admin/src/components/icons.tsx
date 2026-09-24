import type { CSSProperties } from "react";

export type IconProps = {
  className?: string;
};

export function MaterialIcon({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={`material-symbols-outlined${className ? ` ${className}` : ""}`} style={style}>
      {name}
    </span>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M2.5 10L4.16667 8.33333M4.16667 8.33333L10 2.5L15.8333 8.33333M4.16667 8.33333V16.6667C4.16667 17.1269 4.53976 17.5 5 17.5H7.5M15.8333 8.33333L17.5 10M15.8333 8.33333V16.6667C15.8333 17.1269 15.4602 17.5 15 17.5H12.5M7.5 17.5C7.96024 17.5 8.33333 17.1269 8.33333 16.6667V13.3333C8.33333 12.8731 8.70643 12.5 9.16667 12.5H10.8333C11.2936 12.5 11.6667 12.8731 11.6667 13.3333V16.6667C11.6667 17.1269 12.0398 17.5 12.5 17.5M7.5 17.5H12.5"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M6.66667 5.83333V2.5M13.3333 5.83333V2.5M5.83333 9.16667H14.1667M4.16667 17.5H15.8333C16.7538 17.5 17.5 16.7538 17.5 15.8333V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5L6.66667 5.83333"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BarsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M7.5 15.8333V10.8333C7.5 9.91286 6.75381 9.16667 5.83333 9.16667H4.16667C3.24619 9.16667 2.5 9.91286 2.5 10.8333V15.8333C2.5 16.7538 3.24619 17.5 4.16667 17.5H5.83333C6.75381 17.5 7.5 16.7538 7.5 15.8333V15.8333M7.5 15.8333V7.5C7.5 6.57953 8.24619 5.83333 9.16667 5.83333H10.8333C11.7538 5.83333 12.5 6.57953 12.5 7.5V15.8333M7.5 15.8333C7.5 16.7538 8.24619 17.5 9.16667 17.5H10.8333C11.7538 17.5 12.5 16.7538 12.5 15.8333M12.5 15.8333V4.16667C12.5 3.24619 13.2462 2.5 14.1667 2.5H15.8333C16.7538 2.5 17.5 3.24619 17.5 4.16667V15.8333C17.5 16.7538 16.7538 17.5 15.8333 17.5H14.1667C13.2462 17.5 12.5 16.7538 12.5 15.8333H7.5"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TicketIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12.5 4.16667V5.83333M12.5 9.16667V10.8333M12.5 14.1667V15.8333M4.16667 4.16667C3.24619 4.16667 2.5 4.91286 2.5 5.83333V8.33333C3.41986 8.33333 4.16667 9.08014 4.16667 10C4.16667 10.9199 3.41986 11.6667 2.5 11.6667V14.1667C2.5 15.0871 3.24619 15.8333 4.16667 15.8333H15.8333C16.7538 15.8333 17.5 15.0871 17.5 14.1667V11.6667C16.5801 11.6667 15.8333 10.9199 15.8333 10C15.8333 9.08014 16.5801 8.33333 17.5 8.33333V5.83333C17.5 4.91286 16.7538 4.16667 15.8333 4.16667H4.16667"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ScanIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M4.16667 6.66667H5.83333C6.29357 6.66667 6.66667 6.29357 6.66667 5.83333V4.16667C6.66667 3.70643 6.29357 3.33333 5.83333 3.33333H4.16667C3.70643 3.33333 3.33333 3.70643 3.33333 4.16667V5.83333C3.33333 6.29357 3.70643 6.66667 4.16667 6.66667ZM15.8333 6.66667C16.2936 6.66667 16.6667 6.29357 16.6667 5.83333V4.16667C16.6667 3.70643 16.2936 3.33333 15.8333 3.33333H14.1667C13.7064 3.33333 13.3333 3.70643 13.3333 4.16667V5.83333C13.3333 6.29357 13.7064 6.66667 14.1667 6.66667H15.8333ZM10 3.33333V4.16667M15 13.3333H16.6667M11.6667 13.3333H10V16.6667M10 7.5V10M10 10H10.0083M10 10H13.3417M13.3333 16.6667H16.6667M3.33333 10H6.66667M16.6667 10H16.675M4.16667 16.6667H5.83333C6.29357 16.6667 6.66667 16.2936 6.66667 15.8333V14.1667C6.66667 13.7064 6.29357 13.3333 5.83333 13.3333H4.16667C3.70643 13.3333 3.33333 13.7064 3.33333 14.1667V15.8333C3.33333 16.2936 3.70643 16.6667 4.16667 16.6667Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M14.1667 16.6667H18.3333V15C18.3333 13.935 17.6585 12.987 16.6523 12.6381C15.6461 12.2893 14.5293 12.6161 13.87 13.4525M14.1667 16.6667H5.83333M14.1667 16.6667V15C14.1667 14.4533 14.0617 13.9308 13.87 13.4525M5.83333 16.6667H1.66667V15C1.66674 13.935 2.34149 12.987 3.34771 12.6381C4.35393 12.2893 5.4707 12.6161 6.13 13.4525M5.83333 16.6667V15C5.83333 14.4533 5.93833 13.9308 6.13 13.4525M6.13 13.4525C6.76315 11.8702 8.29575 10.8327 10 10.8327C11.7043 10.8327 13.2369 11.8702 13.87 13.4525M12.5 5.83333C12.5 7.21312 11.3798 8.33333 10 8.33333C8.62021 8.33333 7.5 7.21312 7.5 5.83333C7.5 4.45355 8.62021 3.33333 10 3.33333C11.3798 3.33333 12.5 4.45355 12.5 5.83333ZM19.1667 19.1667C19.1667 20.0865 18.4199 20.8333 17.5 20.8333C16.5801 20.8333 15.8333 20.0865 15.8333 19.1667C15.8333 18.2468 16.5801 17.5 17.5 17.5C18.4199 17.5 19.1667 18.2468 19.1667 19.1667ZM5.83333 8.33333C5.83333 9.25319 5.08652 10 4.16667 10C3.24681 10 2.5 9.25319 2.5 8.33333C2.5 7.41347 3.24681 6.66667 4.16667 6.66667C5.08652 6.66667 5.83333 7.41347 5.83333 8.33333Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M10 6.66667V10L12.5 12.5M17.5 10C17.5 14.1394 14.1394 17.5 10 17.5C5.86064 17.5 2.5 14.1394 2.5 10C2.5 5.86064 5.86064 2.5 10 2.5C14.1394 2.5 17.5 5.86064 17.5 10Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TeamIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M10 3.62833C10.917 2.58871 12.3817 2.22516 13.6785 2.71533C14.9752 3.20551 15.8331 4.44707 15.8331 5.83333C15.8331 7.2196 14.9752 8.46116 13.6785 8.95133C12.3817 9.4415 10.917 9.07796 10 8.03833M12.5 17.5H2.5V16.6667C2.5 13.9071 4.74042 11.6667 7.5 11.6667C10.2596 11.6667 12.5 13.9071 12.5 16.6667V17.5ZM10.8333 5.83333C10.8333 7.67305 9.33972 9.16667 7.5 9.16667C5.66028 9.16667 4.16667 7.67305 4.16667 5.83333C4.16667 3.99362 5.66028 2.5 7.5 2.5C9.33972 2.5 10.8333 3.99362 10.8333 5.83333Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GearIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M8.60417 3.5975C8.95917 2.13417 11.0408 2.13417 11.3958 3.5975C11.5039 4.04338 11.8184 4.41085 12.2422 4.58645C12.6661 4.76206 13.1483 4.72467 13.54 4.48583C14.8258 3.7025 16.2983 5.17417 15.515 6.46083C15.2765 6.85238 15.2392 7.33423 15.4146 7.75782C15.59 8.1814 15.957 8.49583 16.4025 8.60417C17.8658 8.95917 17.8658 11.0408 16.4025 11.3958C15.9566 11.5039 15.5891 11.8184 15.4135 12.2422C15.2379 12.6661 15.2753 13.1483 15.5142 13.54C16.2975 14.8258 14.8258 16.2983 13.5392 15.515C13.1476 15.2765 12.6658 15.2392 12.2422 15.4146C11.8186 15.59 11.5042 15.957 11.3958 16.4025C11.0408 17.8658 8.95917 17.8658 8.60417 16.4025C8.49613 15.9566 8.18164 15.5891 7.75779 15.4135C7.33394 15.2379 6.85172 15.2753 6.46 15.5142C5.17417 16.2975 3.70167 14.8258 4.485 13.5392C4.72349 13.1476 4.76079 12.6658 4.58539 12.2422C4.41 11.8186 4.04298 11.5042 3.5975 11.3958C2.13417 11.0408 2.13417 8.95917 3.5975 8.60417C4.04338 8.49613 4.41085 8.18164 4.58645 7.75779C4.76206 7.33394 4.72467 6.85172 4.48583 6.46C3.7025 5.17417 5.17417 3.70167 6.46083 4.485C7.29083 4.99167 8.37417 4.54333 8.60417 3.5975Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 10C12.5 11.3798 11.3798 12.5 10 12.5C8.62021 12.5 7.5 11.3798 7.5 10C7.5 8.62021 8.62021 7.5 10 7.5C11.3798 7.5 12.5 8.62021 12.5 10Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path
        d="M14 14L10 10M11.3333 6.66667C11.3333 9.24227 9.24227 11.3333 6.66667 11.3333C4.09106 11.3333 2 9.24227 2 6.66667C2 4.09106 4.09106 2 6.66667 2C9.24227 2 11.3333 4.09106 11.3333 6.66667Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12.5 14.1667H16.6667L15.4958 12.9958C15.1783 12.6782 14.9999 12.2475 15 11.7983V9.16667C15.0003 7.04725 13.6647 5.15777 11.6667 4.45083V4.16667C11.6667 3.24681 10.9199 2.5 10 2.5C9.08014 2.5 8.33333 3.24681 8.33333 4.16667V4.45083C6.39167 5.1375 5 6.99 5 9.16667V11.7992C5 12.2475 4.82167 12.6783 4.50417 12.9958L3.33333 14.1667H7.5M12.5 14.1667V15C12.5 16.3798 11.3798 17.5 10 17.5C8.62021 17.5 7.5 16.3798 7.5 15V14.1667M12.5 14.1667H7.5"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12.6667 6L8 10.6667L3.33333 6"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CalendarSmallIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path
        d="M5.33333 4.66667V2M10.6667 4.66667V2M4.66667 7.33333H11.3333M3.33333 14H12.6667C13.4026 14 14 13.4026 14 12.6667V4.66667C14 3.93078 13.4026 3.33333 12.6667 3.33333H3.33333C2.59745 3.33333 2 3.93078 2 4.66667V12.6667C2 13.4026 2.59745 14 3.33333 14Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path
        d="M8 2.66667V13.3333M13.3333 8H2.66667"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BarsSolidIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M5 9.2H8V19H5V9.2M10.6 5H13.4V19H10.6V5M16.2 13H19V19H16.2V13" fill="currentColor" />
    </svg>
  );
}

export function TrendUpIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" className={className}>
      <path
        d="M4.08333 9.91667L9.91667 4.08333M9.91667 4.08333H4.08333M9.91667 4.08333V9.91667"
        stroke="currentColor"
        strokeWidth="1.45833"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TicketSolidIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M15 5V7M15 11V13M15 17V19M5 5C3.89617 5 3 5.89617 3 7V10C4.10383 10 5 10.8962 5 12C5 13.1038 4.10383 14 3 14V17C3 18.1038 3.89617 19 5 19H19C20.1038 19 21 18.1038 21 17V14C19.8962 14 19 13.1038 19 12C19 10.8962 19.8962 10 21 10V7C21 5.89617 20.1038 5 19 5H5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CalendarSolidIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1038 21 21 20.1038 21 19V7C21 5.89617 20.1038 5 19 5H5C3.89617 5 3 5.89617 3 7V19C3 20.1038 3.89617 21 5 21Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PieIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M11 3.055C6.31689 3.57836 2.83011 7.62513 3.00488 12.3342C3.17966 17.0432 6.95682 20.8203 11.6658 20.9951C16.3749 21.1699 20.4216 17.6831 20.945 13H11V3.055Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.488 9H15V3.512C17.5627 4.42118 19.5788 6.43733 20.488 9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronRightTinyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 8 3" fill="none" aria-hidden="true" className={className}>
      <path
        d="M5.79 1.15C5.57 0.89 5.34 0.51 5.1 0H5.52C6.02 0.58 6.54 1.02 7.1 1.3V1.51C6.54 1.8 6.02 2.23 5.52 2.81H5.1C5.34 2.3 5.57 1.92 5.8 1.66H0V1.15H5.79Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TagIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M18 3C17.9998 2.70053 17.8654 2.41691 17.6338 2.22711C17.4022 2.03731 17.0977 1.9613 16.804 2.02L6.804 4.02C6.33674 4.11339 6.00029 4.5235 6 5V14.114C5.67217 14.0376 5.33661 13.9994 5 14C3.343 14 2 14.895 2 16C2 17.105 3.343 18 5 18C6.657 18 8 17.105 8 16V7.82L16 6.22V12.114C15.5159 12.6503 15.1723 13.2983 15 14C13.343 14 12 14.895 12 16C12 17.105 13.343 18 15 18C16.657 18 18 17.105 18 16V3Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path
        d="M10 8C10 9.10383 9.10383 10 8 10C6.89617 10 6 9.10383 6 8C6 6.89617 6.89617 6 8 6C9.10383 6 10 6.89617 10 8Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.63867 8C2.488 5.29533 5.01533 3.33333 8 3.33333C10.9853 3.33333 13.512 5.29533 14.3613 8C13.512 10.7047 10.9853 12.6667 8 12.6667C5.01533 12.6667 2.488 10.7047 1.63867 8Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MoreIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path
        d="M8 4.8C7.11694 4.8 6.4 4.08306 6.4 3.2C6.4 2.31694 7.11694 1.6 8 1.6C8.88306 1.6 9.6 2.31694 9.6 3.2C9.6 4.08306 8.88306 4.8 8 4.8ZM8 9.6C7.11694 9.6 6.4 8.88306 6.4 8C6.4 7.11694 7.11694 6.4 8 6.4C8.88306 6.4 9.6 7.11694 9.6 8C9.6 8.88306 8.88306 9.6 8 9.6ZM8 14.4C7.11694 14.4 6.4 13.6831 6.4 12.8C6.4 11.9169 7.11694 11.2 8 11.2C8.88306 11.2 9.6 11.9169 9.6 12.8C9.6 13.6831 8.88306 14.4 8 14.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path
        d="M7.33333 10.6667L4.66667 8M4.66667 8L7.33333 5.33333M4.66667 8H14M10.6667 10.6667V11.3333C10.6667 12.4372 9.7705 13.3333 8.66667 13.3333H4C2.89617 13.3333 2 12.4372 2 11.3333V4.66667C2 3.56284 2.89617 2.66667 4 2.66667H8.66667C9.7705 2.66667 10.6667 3.56284 10.6667 4.66667V5.33333"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SparkleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M4.16667 2.5V5.83333M2.5 4.16667H5.83333M5 14.1667V17.5M3.33333 15.8333H6.66667M10.8333 2.5L12.7383 8.21417L17.5 10L12.7383 11.7858L10.8333 17.5L8.92833 11.7858L4.16667 10L8.92833 8.21417L10.8333 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PaletteIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path
        d="M4.66667 14C3.19489 14 2 12.8051 2 11.3333V3.33333C2 2.59745 2.59745 2 3.33333 2H6C6.73589 2 7.33333 2.59745 7.33333 3.33333V11.3333C7.33333 12.8051 6.13844 14 4.66667 14ZM4.66667 14H12.6667C13.4026 14 14 13.4026 14 12.6667V10C14 9.26411 13.4026 8.66667 12.6667 8.66667H11.1047M7.33333 4.89533L8.438 3.79067C8.95867 3.27016 9.80267 3.27016 10.3233 3.79067L12.2093 5.67667C12.7298 6.19733 12.7298 7.04133 12.2093 7.562L6.552 13.2187M4.66667 11.3333H4.67333"
        stroke="currentColor"
        strokeWidth="1.46667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RestoreIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" className={className}>
      <path
        d="M2.33333 2.33333V5.25H2.67283M11.6305 6.41667C11.3652 4.30858 9.70949 2.64574 7.60257 2.37133C5.49564 2.09692 3.46927 3.2802 2.67283 5.25M2.67283 5.25H5.25M11.6667 11.6667V8.75H11.3277M11.3277 8.75C10.5302 10.7186 8.50429 11.9006 6.39806 11.6263C4.29183 11.352 2.63626 9.69053 2.3695 7.58333M11.3277 8.75H8.75"
        stroke="currentColor"
        strokeWidth="1.28333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PublishIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" className={className}>
      <path
        d="M7 11.0833L12.25 12.25L7 1.75L1.75 12.25L7 11.0833V6.41667"
        stroke="currentColor"
        strokeWidth="1.28333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" className={className}>
      <path
        d="M11.0833 4.08333L10.5776 11.1662C10.5341 11.7768 10.026 12.25 9.41383 12.25H4.58617C3.97397 12.25 3.46588 11.7768 3.42242 11.1662L2.91667 4.08333M5.83333 6.41667V9.91667M8.16667 6.41667V9.91667M8.75 4.08333V2.33333C8.75 2.01138 8.48862 1.75 8.16667 1.75H5.83333C5.51138 1.75 5.25 2.01138 5.25 2.33333V4.08333M2.33333 4.08333H11.6667"
        stroke="currentColor"
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EyedropperIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12.952 10.2853C12.7659 10.0992 12.5288 9.9723 12.2707 9.92067L10.6793 9.60267C9.80709 9.42823 8.90159 9.54951 8.106 9.94733L7.894 10.0527C7.09841 10.4505 6.19291 10.5718 5.32067 10.3973L4.03333 10.14C3.59628 10.0527 3.14449 10.1895 2.82933 10.5047M5.33333 2.66667H10.6667L10 3.33333V6.78133C10.0001 7.13493 10.1406 7.47401 10.3907 7.724L13.724 11.0573C14.564 11.8973 13.9687 13.3333 12.7807 13.3333H3.21867C2.03067 13.3333 1.436 11.8973 2.276 11.0573L5.60933 7.724C5.8594 7.47401 5.99992 7.13493 6 6.78133V3.33333L5.33333 2.66667Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ResetSmallIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path
        d="M2.66667 2.66667V6H3.05467M13.292 7.33333C12.9888 4.92409 11.0966 3.02371 8.68865 2.71009C6.28073 2.39648 3.96488 3.7488 3.05467 6M3.05467 6H6M13.3333 13.3333V10H12.946M12.946 10C12.0345 12.2498 9.71918 13.6007 7.31207 13.2873C4.90495 12.9738 3.01287 11.0749 2.708 8.66667M12.946 10H10"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DesktopIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" className={className}>
      <path
        d="M5.6875 9.91667L5.25 11.6667L4.66667 12.25H9.33333L8.75 11.6667L8.3125 9.91667M1.75 7.58333H12.25M2.91667 9.91667H11.0833C11.7272 9.91667 12.25 9.3939 12.25 8.75V2.91667C12.25 2.27277 11.7272 1.75 11.0833 1.75H2.91667C2.27277 1.75 1.75 2.27277 1.75 2.91667V8.75C1.75 9.3939 2.27277 9.91667 2.91667 9.91667H5.6875"
        stroke="currentColor"
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MobileIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" className={className}>
      <path
        d="M7 10.5H7.00583M4.66667 12.25H9.33333C9.97723 12.25 10.5 11.7272 10.5 11.0833V2.91667C10.5 2.27277 9.97723 1.75 9.33333 1.75H4.66667C4.02277 1.75 3.5 2.27277 3.5 2.91667V11.0833C3.5 11.7272 4.02277 12.25 4.66667 12.25Z"
        stroke="currentColor"
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShieldPersonIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M10 2.5L16.6667 5V9.58333C16.6667 13.5417 13.8333 17.1417 10 18.3333C6.16667 17.1417 3.33333 13.5417 3.33333 9.58333V5L10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11.25C11.1506 11.25 12.0833 10.3173 12.0833 9.16667C12.0833 8.01608 11.1506 7.08333 10 7.08333C8.84942 7.08333 7.91667 8.01608 7.91667 9.16667C7.91667 10.3173 8.84942 11.25 10 11.25Z"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.875 14.375C7.30833 13.125 8.55 12.5 10 12.5C11.45 12.5 12.6917 13.125 13.125 14.375"
        stroke="currentColor"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckSmallIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" className={className}>
      <path d="M2.9 7.22L5 9.32L11.1 3.22" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
