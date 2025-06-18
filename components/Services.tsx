"use client";

import {
  Box,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Hammer,
  Sofa,
  MapPin,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/lui/button";
import { Input } from "@/components/lui/input";
import Image from "next/image";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { fbEvent } from '@/components/FacebookPixel';

interface ServiceOption {
  id: string;
  label: string;
  subLabel?: string;
  price: string | number;
  pricePerMeter?: number;
  type?: "items" | "area";
}

interface AdditionalService {
  id: string;
  label: string;
  type: "items" | "area";
  basePrice: number;
  pricePerUnit: number;
}

interface Service {
  id: string;
  title: string;
  description: string;
  image: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor?: string;
  needsSize?: boolean;
  options: ServiceOption[];
  additionalServices?: AdditionalService[];
}

const services: Service[] = [
  {
    id: "regular-cleaning",
    title: "Ménage Régulier",
    description:
      "Service de nettoyage professionnel pour maintenir votre espace impeccable",
    image: "/Menageregulier.jpg",
    icon: <Sparkles className="w-8 h-8" />,
    bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
    needsSize: true,
    additionalServices: [
      {
        id: "ironing",
        label: "Repassage",
        type: "items",
        basePrice: 65,
        pricePerUnit: 65,
      },
      {
        id: "deep-cleaning",
        label: "Grand ménage",
        type: "area",
        basePrice: 0,
        pricePerUnit: 1,
      },
      {
        id: "kitchen-cabinets",
        label: "Placards de cuisine",
        type: "area",
        basePrice: 0,
        pricePerUnit: 1,
      },
      {
        id: "clothes-cabinets",
        label: "Placard des vêtements",
        type: "area",
        basePrice: 0,
        pricePerUnit: 1,
      },
      {
        id: "furniture",
        label: "Canapés, lits et matelas",
        type: "items",
        basePrice: 100,
        pricePerUnit: 100,
      },
      {
        id: "carpet",
        label: "Tapis",
        type: "area",
        basePrice: 0,
        pricePerUnit: 15,
      },
    ],
    options: [
      {
        id: "monthly-subscription",
        label: "Abonnement Mensuel",
        subLabel: "4 visites par mois",
        price: 0,
        pricePerMeter: 1.75,
      },
      {
        id: "single-visit",
        label: "Visite Unique",
        subLabel: "Une seule visite",
        price: 0,
        pricePerMeter: 2,
      },
    ],
  },
  {
    id: "deep-cleaning",
    title: "Nettoyage Fin de Chantier",
    description:
      "Nettoyage approfondi après travaux pour un résultat impeccable",
    image: "/NettoyageFindeChantier.jpg",
    icon: <Hammer className="w-8 h-8" />,
    bgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
    needsSize: true,
    options: [
      {
        id: "post-construction",
        label: "Après Travaux",
        subLabel: "Nettoyage complet",
        price: 0,
        pricePerMeter: 9,
      },
    ],
  },
  {
    id: "carpet-cleaning",
    title: "Nettoyage Tapis & Canapés",
    description: "Service professionnel pour vos tapis et canapés",
    image: "/NettoyageTapisCanapés.jpg",
    icon: <Sofa className="h-8 w-8" />,
    bgColor: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    options: [
      {
        id: "carpet",
        label: "Tapis",
        subLabel: "Par m²",
        price: "Sur devis",
        type: "area",
      },
      {
        id: "sofa",
        label: "Canapé",
        subLabel: "Par place",
        price: "Sur devis",
        type: "items",
      },
    ],
  },
];

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  size: string;
}

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  onNext: () => void;
  step?: number;
  setStep: (step: number) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  isSelected,
  onNext,
  step = 0,
  setStep,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [sizeValue, setSizeValue] = useState<string>("");
  const [selectedAdditionalServices, setSelectedAdditionalServices] = useState<
    string[]
  >([]);
  const [additionalServiceValues, setAdditionalServiceValues] = useState<
    Record<string, string>
  >({});
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    district: "",
    size: "",
  });
  const [isValidPhone, setIsValidPhone] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (value: string | undefined) => {
    setFormData((prev) => ({ ...prev, phone: value || "" }));
    setIsValidPhone(value ? isValidPhoneNumber(value) : false);
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSizeValue(e.target.value);
  };

  const getLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          });
        }
      );

      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `/api/geocode?lat=${latitude}&lng=${longitude}`
      );
      const data = await response.json();

      if (data.results && data.results[0]) {
        const result = data.results[0];
        const components = result.components;

        setFormData((prev) => ({
          ...prev,
          city:
            components.city ||
            components.town ||
            components.municipality ||
            prev.city,
          district: result.formatted,
        }));
      }
    } catch (error) {
      console.error("Error getting location:", error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const calculateTotalPrice = useCallback(() => {
    let price = 0;
    const selectedOption = service.options.find(
      (opt) => opt.id === selectedOptionId
    );

    // Calculate base service price
    if (selectedOption?.pricePerMeter && sizeValue) {
      price =
        selectedOption.pricePerMeter *
        parseFloat(sizeValue) *
        (selectedOption.id === "monthly-subscription" ? 4 : 1);
    }

    // Add additional service prices
    selectedAdditionalServices.forEach((serviceId) => {
      const value = additionalServiceValues[serviceId];
      const additionalService = service.additionalServices?.find(
        (s) => s.id === serviceId
      );

      if (additionalService) {
        if (additionalService.id === "ironing") {
          // For ironing, automatically calculate based on subscription type
          price +=
            additionalService.basePrice *
            (selectedOption?.id === "monthly-subscription" ? 4 : 1);
        } else if (
          (additionalService.id === "deep-cleaning" ||
            additionalService.id === "kitchen-cabinets" ||
            additionalService.id === "clothes-cabinets") &&
          sizeValue
        ) {
          // For services that use the main surface area
          price += additionalService.pricePerUnit * parseFloat(sizeValue);
        } else if (additionalService.type === "items" && value) {
          price += additionalService.basePrice * Math.max(1, parseInt(value));
        } else if (value) {
          price += additionalService.pricePerUnit * parseFloat(value);
        }
      }
    });

    setTotalPrice(price);
  }, [
    selectedOptionId,
    sizeValue,
    selectedAdditionalServices,
    additionalServiceValues,
    service,
  ]);

  const getPriceRange = (price: number) => {
    const minPrice = price * 0.8; // 20% less
    const maxPrice = price * 1.2; // 20% more
    return {
      min: minPrice.toFixed(2),
      max: maxPrice.toFixed(2),
    };
  };

  useEffect(() => {
    calculateTotalPrice();
  }, [calculateTotalPrice]);

  const handleWhatsAppSubmit = async () => {
    setIsLoading(true);
    const selectedOption = service.options.find(
      (opt) => opt.id === selectedOptionId
    );

    try {
      // Track the lead event before form submission
      fbEvent('Lead', {
        content_name: service.title,
        content_category: 'Service Booking',
        content_type: selectedOption?.label,
        value: totalPrice,
        currency: 'MAD',
        status: 'submitted',
        surface_area: sizeValue || 'N/A',
        additional_services: selectedAdditionalServices.map(id => {
          const additionalService = service.additionalServices?.find(s => s.id === id);
          return {
            name: additionalService?.label,
            value: additionalServiceValues[id]
          };
        })
      });

      // Format additional services for sheets
      const additionalServicesData = selectedAdditionalServices.map((id) => {
        const additionalService = service.additionalServices?.find(
          (s) => s.id === id
        );
        const value = additionalServiceValues[id];
        const price =
          additionalService?.type === "items"
            ? (additionalService.basePrice || 0) *
              Math.max(1, parseInt(value || "0"))
            : (additionalService?.pricePerUnit || 0) * parseFloat(value || "0");
        return {
          service: additionalService?.label,
          quantity: value,
          type: additionalService?.type,
          price: price,
        };
      });

      // Submit to Google Sheets
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "service",
          data: {
            ...formData,
            service: service.title,
            option: selectedOption?.label,
            size: sizeValue,
            additionalServices: additionalServicesData,
            totalPrice: totalPrice,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      // Track successful submission
      fbEvent('SubmitApplication', {
        content_name: service.title,
        content_category: 'Service Booking',
        content_type: selectedOption?.label,
        value: totalPrice,
        currency: 'MAD',
        status: 'success'
      });

      setIsSuccess(true);
      setIsLoading(false);

      setTimeout(() => {
        // Prepare WhatsApp message
        const message = `
*Nouvelle Demande de Service*
---------------------------
*Service:* ${service.title}
*Formule:* ${selectedOption?.label}
${selectedOption?.subLabel ? `*Type:* ${selectedOption?.subLabel}` : ""}
${sizeValue ? `*Superficie:* ${sizeValue}m²` : ""}
*Prix Base Estimé:* ${
          selectedOption?.pricePerMeter
            ? (() => {
                const basePrice =
                  selectedOption.pricePerMeter *
                  parseFloat(sizeValue) *
                  (selectedOption.id === "monthly-subscription" ? 4 : 1);
                const range = getPriceRange(basePrice);
                return `${range.min}dhs - ${range.max}dhs`;
              })()
            : selectedOption?.price
        }
${
  selectedAdditionalServices.length > 0
    ? `
*Services Additionnels:*${selectedAdditionalServices
        .map((id) => {
          const additionalService = service.additionalServices?.find(
            (s) => s.id === id
          );
          let serviceStr = "";
          let price = 0;

          if (additionalService?.id === "ironing") {
            const visits =
              selectedOption?.id === "monthly-subscription"
                ? "4 semaines"
                : "1 semaine";
            price =
              selectedOption?.id === "monthly-subscription"
                ? additionalService.basePrice * 4
                : additionalService.basePrice;
            const range = getPriceRange(price);
            serviceStr = `\n• ${additionalService.label}: ${visits} (${range.min}dhs - ${range.max}dhs)`;
          } else if (
            ["deep-cleaning", "kitchen-cabinets", "clothes-cabinets"].includes(
              additionalService?.id || ""
            )
          ) {
            const surfaceArea = parseFloat(sizeValue || "0");
            let pricePerUnit = 0;

            switch (additionalService?.id) {
              case "deep-cleaning":
                pricePerUnit = 1;
                break;
              case "kitchen-cabinets":
              case "clothes-cabinets":
                pricePerUnit = 0.83;
                break;
            }

            price = surfaceArea * pricePerUnit;
            const range = getPriceRange(price);
            serviceStr = `\n• ${additionalService?.label}: ${sizeValue}m² (${range.min}dhs - ${range.max}dhs)`;
          } else {
            const value = additionalServiceValues[id];
            if (
              additionalService?.type === "items" &&
              additionalService?.basePrice
            ) {
              price =
                additionalService.basePrice *
                Math.max(1, parseInt(value || "0"));
            } else if (
              additionalService?.type === "area" &&
              additionalService?.pricePerUnit
            ) {
              price = additionalService.pricePerUnit * parseFloat(value || "0");
            }
            const range = getPriceRange(price);
            serviceStr = `\n• ${additionalService?.label}: ${value} ${
              additionalService?.type === "items" ? "articles" : "m²"
            } (${range.min}dhs - ${range.max}dhs)`;
          }

          return serviceStr;
        })
        .join("")}

*Sous-total Services Additionnels Estimé:* ${(() => {
        const total = selectedAdditionalServices.reduce((total, id) => {
          const additionalService = service.additionalServices?.find(
            (s) => s.id === id
          );
          const value = additionalServiceValues[id];
          let price = 0;

          if (additionalService?.id === "ironing") {
            price =
              selectedOption?.id === "monthly-subscription"
                ? additionalService.basePrice * 4
                : additionalService.basePrice;
          } else if (
            ["deep-cleaning", "kitchen-cabinets", "clothes-cabinets"].includes(
              additionalService?.id || ""
            )
          ) {
            const surfaceArea = parseFloat(sizeValue || "0");
            let pricePerUnit = 0;

            switch (additionalService?.id) {
              case "deep-cleaning":
                pricePerUnit = 1;
                break;
              case "kitchen-cabinets":
              case "clothes-cabinets":
                pricePerUnit = 0.83;
                break;
            }

            price = surfaceArea * pricePerUnit;
          } else {
            if (
              additionalService?.type === "items" &&
              additionalService?.basePrice
            ) {
              price =
                additionalService.basePrice *
                Math.max(1, parseInt(value || "0"));
            } else if (
              additionalService?.type === "area" &&
              additionalService?.pricePerUnit
            ) {
              price = additionalService.pricePerUnit * parseFloat(value || "0");
            }
          }

          return total + price;
        }, 0);
        const range = getPriceRange(total);
        return `${range.min}dhs - ${range.max}dhs`;
      })()}`
    : ""
}

*Prix Total Estimé:* ${(() => {
          const range = getPriceRange(totalPrice);
          return `${range.min}dhs - ${range.max}dhs`;
        })()}

*Informations Client:*
Nom: ${formData.fullName}
Téléphone: ${formData.phone}
Ville: ${formData.city}
Quartier: ${formData.district}
        `.trim();

        // Track WhatsApp redirect
        fbEvent('Contact', {
          content_name: service.title,
          content_category: 'WhatsApp Redirect',
          content_type: selectedOption?.label,
          value: totalPrice,
          currency: 'MAD'
        });

        // Open WhatsApp
        const whatsappUrl = `https://wa.me/212616090788`
        // ?text=${encodeURIComponent(
        //   message
        // )}`
        ;
        window.open(whatsappUrl, "_blank");
      }, 1000);
    } catch (error) {
      console.error("Error submitting form:", error);
      
      // Track error event
      fbEvent('SubmitError', {
        content_name: service.title,
        content_category: 'Service Booking',
        content_type: selectedOption?.label,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 0:
        return (
          <>
            <div className="relative w-full h-[200px] rounded-t-lg overflow-hidden">
              <Image
                src={service.image}
                alt={service.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
              <div
                className={`absolute top-4 left-4 ${service.bgColor} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg`}
              >
                {service.icon}
              </div>
            </div>
            <div className="mb-auto space-y-4">
              <h3 className="text-2xl font-bold">{service.title}</h3>
              <p className="text-base text-muted-foreground">
                {service.description}
              </p>
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onNext?.();
              }}
              className="w-full h-14 text-base font-medium rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
            >
              Sélectionner
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </>
        );
      case 1:
        return (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setStep(0);
                  setIsLoading(false);
                  setIsSuccess(false);
                }}
                className="h-8 w-8 rounded-lg hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div
                className={`${service.bgColor} w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg flex-shrink-0`}
              >
                {service.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold">{service.title}</h3>
                <p className="text-xs text-muted-foreground">
                  Sélectionnez votre formule
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {service.needsSize && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Box className="h-4 w-4 text-primary" />
                    Surface en m²
                  </label>
                  <Input
                    type="number"
                    value={sizeValue}
                    onChange={handleSizeChange}
                    placeholder="Entrez la surface en m²"
                    className="h-10 text-sm bg-white/50 focus:bg-white border-2 rounded-lg"
                  />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Check className="h-4 w-4" />
                  Choisissez votre formule
                </div>
                {service.options.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => setSelectedOptionId(option.id)}
                    className={`p-4 rounded-lg transition-all cursor-pointer ${
                      selectedOptionId === option.id
                        ? "bg-primary/5 border-2 border-primary"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.subLabel}</div>
                      </div>
                      {/* <div className="text-sm font-semibold text-primary">
                        {typeof option.price === "string"
                          ? option.price
                          : option.pricePerMeter && sizeValue
                          ? `À partir de ${(
                              option.pricePerMeter *
                              parseFloat(sizeValue) *
                              (option.id === "monthly-subscription" ? 4 : 1)
                            ).toFixed(2)}dhs`
                          : option.pricePerMeter
                          ? `À partir de ${option.pricePerMeter}dhs/m²`
                          : ""}
                      </div> */}
                    </div>
                    {selectedOptionId === option.id && service.id === "carpet-cleaning" && (
                      <div className="mt-3">
                        <Input
                          type="number"
                          value={additionalServiceValues[option.id] || ""}
                          onChange={(e) =>
                            setAdditionalServiceValues((prev) => ({
                              ...prev,
                              [option.id]: e.target.value,
                            }))
                          }
                          placeholder={option.type === "area" ? "Surface en m²" : "Nombre de places"}
                          className="h-9 text-sm bg-white focus:bg-white border rounded-md"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t">
              <Button
                onClick={() => setStep(service.id === "regular-cleaning" ? 2 : 3)}
                className="w-full h-12 text-sm font-medium rounded-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                disabled={
                  !selectedOptionId || (service.needsSize && !sizeValue)
                }
              >
                Continuer
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      case 2:
        if (service.id === "regular-cleaning") {
          return (
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-4 pb-4 border-b">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setStep(1);
                    setIsLoading(false);
                    setIsSuccess(false);
                  }}
                  className="h-8 w-8 rounded-lg hover:bg-gray-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div
                  className={`${service.bgColor} w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg flex-shrink-0`}
                >
                  {service.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{service.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    Services additionnels
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Check className="h-4 w-4" />
                    Services additionnels (optionnel)
                  </div>
                  {service.additionalServices?.map((additionalService) => (
                    <div
                      key={additionalService.id}
                      onClick={() => {
                        setSelectedAdditionalServices((prev) => {
                          const isSelected = prev.includes(additionalService.id);
                          if (isSelected) {
                            setAdditionalServiceValues((values) => {
                              const newValues = { ...values };
                              delete newValues[additionalService.id];
                              return newValues;
                            });
                            return prev.filter(
                              (id) => id !== additionalService.id
                            );
                          } else {
                            return [...prev, additionalService.id];
                          }
                        });
                      }}
                      className={`relative p-4 rounded-lg transition-all cursor-pointer ${
                        selectedAdditionalServices.includes(additionalService.id)
                          ? "bg-primary/5 border-2 border-primary"
                          : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                      }`}
                    >
                      {selectedAdditionalServices.includes(
                        additionalService.id
                      ) && (
                        <div className="absolute top-3 right-3">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium mb-1">
                            {additionalService.label}
                          </div>
                          {/* <div className="text-xs text-muted-foreground">
                            {additionalService.type === "items"
                              ? additionalService.id === "ironing"
                                ? `${additionalService.basePrice}dhs / semaine ${
                                    service.options.find(
                                      (opt) => opt.id === selectedOptionId
                                    )?.id === "monthly-subscription"
                                      ? "(×4 pour abonnement mensuel)"
                                      : ""
                                  }`
                                : additionalService.id === "furniture" || additionalService.id === "carpet"
                                ? "Sur devis"
                                : `${additionalService.basePrice}dhs / article`
                              : additionalService.id === "carpet"
                              ? "Sur devis"
                              : additionalService.id === "deep-cleaning" ||
                                additionalService.id === "kitchen-cabinets" ||
                                additionalService.id === "clothes-cabinets"
                              ? `${additionalService.pricePerUnit}dhs/m² (basé sur la surface totale)`
                              : `${additionalService.pricePerUnit}dhs/m²`}
                          </div> */}
                          {selectedAdditionalServices.includes(
                            additionalService.id
                          ) && (
                            <div className="mt-1 text-xs font-medium text-primary">
                              {(() => {
                                let estimatedPrice = 0;

                                if (additionalService.id === "ironing") {
                                  estimatedPrice =
                                    additionalService.basePrice *
                                    (service.options.find(
                                      (opt) => opt.id === selectedOptionId
                                    )?.id === "monthly-subscription"
                                      ? 4
                                      : 1);
                                } else if (
                                  (additionalService.id === "deep-cleaning" ||
                                    additionalService.id === "kitchen-cabinets" ||
                                    additionalService.id ===
                                      "clothes-cabinets") &&
                                  sizeValue
                                ) {
                                  estimatedPrice =
                                    additionalService.pricePerUnit *
                                    parseFloat(sizeValue);
                                } else if (
                                  additionalService.type === "items" &&
                                  additionalServiceValues[additionalService.id]
                                ) {
                                  estimatedPrice =
                                    additionalService.basePrice *
                                    Math.max(
                                      1,
                                      parseInt(
                                        additionalServiceValues[
                                          additionalService.id
                                        ]
                                      )
                                    );
                                } else if (
                                  additionalServiceValues[additionalService.id]
                                ) {
                                  estimatedPrice =
                                    additionalService.pricePerUnit *
                                    parseFloat(
                                      additionalServiceValues[
                                        additionalService.id
                                      ]
                                    );
                                }

                                const range = getPriceRange(estimatedPrice);
                                return `Estimation: ${range.min}dhs - ${range.max}dhs`;
                              })()}
                            </div>
                          )}
                        </div>

                        {selectedAdditionalServices.includes(
                          additionalService.id
                        ) &&
                          additionalService.id !== "ironing" &&
                          additionalService.id !== "deep-cleaning" &&
                          additionalService.id !== "kitchen-cabinets" &&
                          additionalService.id !== "clothes-cabinets" && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="w-24 flex-shrink-0"
                            >
                              <Input
                                type="number"
                                value={
                                  additionalServiceValues[additionalService.id] ||
                                  ""
                                }
                                onChange={(e) =>
                                  setAdditionalServiceValues((prev) => ({
                                    ...prev,
                                    [additionalService.id]: e.target.value,
                                  }))
                                }
                                placeholder={
                                  additionalService.type === "items"
                                    ? "Nombre"
                                    : "m²"
                                }
                                className="h-9 text-sm bg-white focus:bg-white border rounded-md"
                              />
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                {/* {totalPrice > 0 && (
                  <div className="text-center">
                    <span className="text-sm font-medium">
                      Prix total estimé:{" "}
                    </span>
                    <div className="text-lg font-bold text-primary">
                      {(() => {
                        const range = getPriceRange(totalPrice);
                        return `${range.min}dhs - ${range.max}dhs`;
                      })()}
                    </div>
                  </div>
                )} */}
                <Button
                  onClick={() => setStep(3)}
                  className="w-full h-12 text-sm font-medium rounded-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                >
                  Continuer
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        }
        setStep(3);
        return null;
      case 3:
        return (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setStep(2);
                  setIsLoading(false);
                  setIsSuccess(false);
                }}
                className="h-8 w-8 rounded-lg hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div
                className={`${service.bgColor} w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg flex-shrink-0`}
              >
                {service.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold">{service.title}</h3>
                <p className="text-xs text-muted-foreground">
                  Remplissez vos informations
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto py-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">
                    Nom et prénom <span className="text-primary">*</span>
                  </label>
                  <Input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleFormChange}
                    required
                    placeholder="Votre nom complet"
                    className="h-10 text-sm bg-white/50 focus:bg-white border-2 rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Numéro de téléphone <span className="text-primary">*</span>
                  </label>
                  <div className="mt-1">
                    <PhoneInput
                      international
                      defaultCountry="MA"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className="h-10 text-sm bg-white/50 focus:bg-white border-2 rounded-lg [&>*]:!bg-transparent [&>*]:!border-0"
                    />
                    {formData.phone && !isValidPhone && (
                      <p className="text-xs text-red-500 mt-1">
                        Veuillez entrer un numéro de téléphone valide
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Ville <span className="text-primary">*</span>
                  </label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleFormChange}
                    required
                    placeholder="Votre ville"
                    className="h-10 text-sm bg-white/50 focus:bg-white border-2 rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Quartier <span className="text-primary">*</span>
                  </label>
                  <div className="relative mt-1">
                    <Input
                      name="district"
                      value={formData.district}
                      onChange={handleFormChange}
                      required
                      placeholder="Votre quartier"
                      className="h-10 text-sm bg-white/50 focus:bg-white border-2 rounded-lg pr-24"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        Cliquer ici
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={getLocation}
                        disabled={isLoadingLocation}
                        className="h-8 w-8 rounded-lg hover:bg-gray-100"
                      >
                        <MapPin
                          className={`h-4 w-4 ${
                            isLoadingLocation ? "animate-pulse" : ""
                          }`}
                        />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleWhatsAppSubmit}
                className={`w-full h-12 text-sm font-medium rounded-lg transition-all duration-300 ${
                  isSuccess
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                }`}
                disabled={
                  !formData.fullName ||
                  !formData.phone ||
                  !isValidPhone ||
                  !formData.city ||
                  !formData.district ||
                  isLoading ||
                  isSuccess
                }
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : isSuccess ? (
                  <div className="flex items-center justify-center gap-2">
                    <Check className="w-5 h-5 animate-[checkmark_0.4s_ease-in-out_forwards]" />
                    <span className="animate-[fadeIn_0.3s_ease-in-out]">
                      Terminé
                    </span>
                  </div>
                ) : (
                  <>
                    Commander
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={cardRef}
      className={`w-full bg-white shadow-xl overflow-hidden transition-all duration-300 rounded-2xl ${
        isSelected ? "ring-4 ring-primary" : ""
      }`}
      style={{ minHeight: step === 0 ? "550px" : "550px" }}
    >
      <div className="relative h-full p-6 flex flex-col">{renderContent()}</div>
    </div>
  );
};

export default function Services() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [step, setStep] = useState(0);

  return (
    <section className="relative min-h-screen w-full pt-10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Nos Services
          </h2>
          <p className="text-xl text-muted-foreground">
            Choisissez le service qui correspond à vos besoins
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isSelected={selectedService?.id === service.id}
              onNext={() => {
                setSelectedService(service);
                setStep(1);
              }}
              step={selectedService?.id === service.id ? step : 0}
              setStep={setStep}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
