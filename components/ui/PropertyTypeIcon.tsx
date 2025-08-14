export interface PropertyTypeIconsProps {
  type: 'flat' | 'house' | 'studio' | 'bungalow' | 'maisonette' | 'featured';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export default function PropertyTypeIcon({
  type,
  size = 'md',
  color = 'currentColor',
  className = '',
}: PropertyTypeIconsProps) {
  const sizeClass = iconSizes[size];
  
  switch (type) {
    case 'flat':
      return (
        <svg className={`${sizeClass} ${className}`} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17,11V3H7v8H3v10h18V11H17z M7,19H5v-6h2V19z M11,19H9v-6h2V19z M11,11H9V5h2V11z M15,19h-2v-6h2V19z M15,11h-2V5h2V11z M19,19h-2v-6h2V19z"/>
        </svg>
      );
    case 'house':
      return (
        <svg className={`${sizeClass} ${className}`} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19,9.3V4h-3v2.6L12,3L2,12h3v8h5v-6h4v6h5v-8h3L19,9.3z"/>
        </svg>
      );
    case 'studio':
      return (
        <svg className={`${sizeClass} ${className}`} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20,4H4C2.9,4,2,4.9,2,6v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V6C22,4.9,21.1,4,20,4z M9.5,16.5v-9l7,4.5L9.5,16.5z"/>
        </svg>
      );
    case 'bungalow':
      return (
        <svg className={`${sizeClass} ${className}`} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12,3L1,11.4l1.21,1.59L4,11.62V21h16v-9.38l1.79,1.36L23,11.4L12,3z M18,19H6V9.99L12,5.52L18,9.99V19z"/>
          <path d="M10,15h4v2h-4V15z"/>
          <path d="M10,11h4v2h-4V11z"/>
        </svg>
      );
    case 'maisonette':
      return (
        <svg className={`${sizeClass} ${className}`} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19,9.3V4h-3v2.6L12,3L2,12h3v8h14v-8h3L19,9.3z M12,18H7v-4h5V18z M17,18h-3v-4H9v-2h8V18z"/>
        </svg>
      );
    case 'featured':
      return (
        <svg className={`${sizeClass} ${className}`} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12,17.27L18.18,21l-1.64-7.03L22,9.24l-7.19-0.61L12,2L9.19,8.63L2,9.24l5.46,4.73L5.82,21L12,17.27z"/>
        </svg>
      );
    default:
      return (
        <svg className={`${sizeClass} ${className}`} fill={color} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12,3L2,12h3v8h14v-8h3L12,3z M12,16c-1.1,0-2-0.9-2-2c0-1.1,0.9-2,2-2s2,0.9,2,2C14,15.1,13.1,16,12,16z"/>
        </svg>
      );
  }
}
