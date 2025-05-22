import { NextResponse } from 'next/server';
import { appendToSheet } from '@/lib/sheets';

interface AdditionalService {
  service: string;
  quantity: string;
  type: 'items' | 'area';
  price: number;
}

interface ServiceData {
  fullName: string;
  phone: string;
  email?: string;
  city: string;
  district: string;
  service: string;
  option: string;
  size?: string;
  additionalServices?: AdditionalService[];
  totalPrice?: number;
}

interface ContactData {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  size: string;
}

interface RequestBody {
  type: 'contact' | 'service';
  data: ContactData | ServiceData;
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { type, data } = body;

    let values: string[][] = [];
    let range = '';

    // Format data based on form type
    if (type === 'contact') {
      const contactData = data as ContactData;
      range = 'Contact!A2:G';
      values = [[
        new Date().toISOString(),
        contactData.fullName,
        contactData.phone,
        contactData.email,
        contactData.city,
        contactData.district,
        contactData.size,
      ]];
    } else if (type === 'service') {
      const serviceData = data as ServiceData;
      range = 'Services!A2:K';
      
      // Format additional services data
      let additionalServicesTotal = 0;
      const additionalServicesStr = serviceData.additionalServices?.map((service: AdditionalService) => {
        let serviceStr = '';
        let price = 0;

        // Handle automatic calculations for specific services
        if (service.service === "Repassage") {
          const visits = serviceData.option?.includes("Mensuel") ? "4 semaines" : "1 semaine";
          price = serviceData.option?.includes("Mensuel") ? service.price * 4 : service.price;
          serviceStr = `• ${service.service}: ${visits} (${price}dhs)`;
        } 
        else if (["Grand ménage", "Placards de cuisine", "Placard des vêtements"].includes(service.service || "")) {
          const surfaceArea = parseFloat(serviceData.size || "0");
          let pricePerUnit = 0;
          
          switch(service.service) {
            case "Grand ménage":
              pricePerUnit = 1;
              break;
            case "Placards de cuisine":
            case "Placard des vêtements":
              pricePerUnit = 0.83;
              break;
          }
          
          price = surfaceArea * pricePerUnit;
          serviceStr = `• ${service.service}: ${serviceData.size}m² (${price.toFixed(2)}dhs)`;
        } 
        else {
          // For other services with manual input
          price = service.price;
          serviceStr = `• ${service.service}: ${service.quantity} ${service.type === 'items' ? 'articles' : 'm²'} (${price}dhs)`;
        }

        additionalServicesTotal += price;
        return serviceStr;
      }).join('\n') || '';

      // Add total of additional services if there are any
      const finalAdditionalServicesStr = serviceData.additionalServices?.length 
        ? `${additionalServicesStr}\n\nSous-total services additionnels: ${additionalServicesTotal.toFixed(2)}dhs`
        : '';

      // Format total price
      const formattedTotalPrice = serviceData.totalPrice ? `${serviceData.totalPrice.toFixed(2)}dhs` : '';

      values = [[
        new Date().toISOString(),
        serviceData.service,
        serviceData.option,
        serviceData.size || '',
        finalAdditionalServicesStr,
        formattedTotalPrice,
        serviceData.fullName,
        serviceData.phone,
        serviceData.city,
        serviceData.district,
        serviceData.email || '',
      ]];
    }

    await appendToSheet(values, range);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling submission:', error);
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    );
  }
} 