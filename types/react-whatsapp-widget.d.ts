declare module 'react-whatsapp-widget' {
  export interface WhatsAppWidgetProps {
    phoneNumber: string;
    companyName?: string;
    message?: string;
    sendButton?: string;
    replyTimeText?: string;
  }

  export function WhatsAppWidget(props: WhatsAppWidgetProps): JSX.Element;
} 