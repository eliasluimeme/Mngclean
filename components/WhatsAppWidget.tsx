"use client";

import { WhatsAppWidget } from "react-whatsapp-widget";
import "react-whatsapp-widget/dist/index.css";
import { fbEvent } from '@/components/FacebookPixel';

export default function WhatsAppButton() {
  const handleWidgetToggle = () => {
    // Track when WhatsApp widget is opened
    fbEvent('Contact', {
      content_name: 'WhatsApp Widget',
      content_category: 'Widget Interaction',
      content_type: 'Chat Initiated'
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <style jsx global>{`
        .rcw-conversation-container {
          border-radius: 20px !important;
          box-shadow: 0 12px 28px 0 rgba(0, 0, 0, 0.2) !important;
        }
        .rcw-header {
          background: #075e54 !important;
          border-radius: 20px 20px 0 0 !important;
          padding: 20px !important;
        }
        .rcw-messages-container {
          background-color: #e5ddd5 !important;
        }
        .rcw-message {
          background: white !important;
          border-radius: 15px !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
          padding: 12px 16px !important;
        }
        .rcw-message-text {
          font-size: 14px !important;
        }
        .rcw-input {
          border-radius: 20px !important;
          margin: 8px !important;
          padding: 12px 16px !important;
          border: none !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          font-family: system-ui, -apple-system, sans-serif !important;
        }
        .rcw-send-button {
          background: #075e54 !important;
          border-radius: 50% !important;
          padding: 8px !important;
          margin: 8px !important;
        }
        .rcw-launcher {
          background-color: #25d366 !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }
      `}</style>
      <div onClick={handleWidgetToggle}>
        <WhatsAppWidget
          phoneNumber="+212616090788"
          companyName="MNG Clean"
          message="👋 Bonjour! Comment pouvons-nous vous aider aujourd'hui?"
          sendButton="Envoyer"
          replyTimeText="Nous répondons en quelques minutes"
        />
      </div>
    </div>
  );
}
