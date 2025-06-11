"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/lui/button";
import { fbEvent, fbCustomEvent } from '@/components/FacebookPixel';

export default function FacebookPixelTest() {
  const [pixelLoaded, setPixelLoaded] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    // Check if Facebook Pixel is loaded
    const checkPixel = () => {
      if (typeof window !== 'undefined' && window.fbq) {
        setPixelLoaded(true);
        addTestResult('✅ Facebook Pixel loaded successfully');
      } else {
        setPixelLoaded(false);
        addTestResult('❌ Facebook Pixel not loaded');
      }
    };

    // Check immediately and then every second for 10 seconds
    checkPixel();
    const interval = setInterval(checkPixel, 1000);
    setTimeout(() => clearInterval(interval), 10000);

    return () => clearInterval(interval);
  }, []);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testStandardEvents = () => {
    addTestResult('🧪 Testing standard Facebook events...');
    
    // Test Lead event
    fbEvent('Lead', {
      content_name: 'Test Lead',
      content_category: 'Test',
      value: 100,
      currency: 'MAD'
    });
    addTestResult('📊 Lead event sent');

    // Test Contact event
    fbEvent('Contact', {
      content_name: 'Test Contact',
      content_category: 'Test'
    });
    addTestResult('📞 Contact event sent');

    // Test SubmitApplication event
    fbEvent('SubmitApplication', {
      content_name: 'Test Application',
      content_category: 'Test'
    });
    addTestResult('📝 SubmitApplication event sent');
  };

  const testCustomEvents = () => {
    addTestResult('🧪 Testing custom Facebook events...');
    
    fbCustomEvent('ServiceInquiry', {
      service_type: 'Regular Cleaning',
      location: 'Test City'
    });
    addTestResult('🏠 ServiceInquiry custom event sent');

    fbCustomEvent('WhatsAppClick', {
      source: 'Test Widget'
    });
    addTestResult('💬 WhatsAppClick custom event sent');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="fixed top-4 left-4 z-50 bg-white p-4 rounded-lg shadow-lg border max-w-md">
      <h3 className="font-bold mb-2">Facebook Pixel Test Panel</h3>
      
      <div className="mb-4">
        <div className={`p-2 rounded ${pixelLoaded ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          Status: {pixelLoaded ? 'Loaded' : 'Not Loaded'}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <Button onClick={testStandardEvents} className="w-full text-sm">
          Test Standard Events
        </Button>
        <Button onClick={testCustomEvents} className="w-full text-sm">
          Test Custom Events
        </Button>
        <Button onClick={clearResults} variant="outline" className="w-full text-sm">
          Clear Results
        </Button>
      </div>

      <div className="max-h-40 overflow-y-auto text-xs">
        <h4 className="font-semibold mb-1">Test Results:</h4>
        {testResults.length === 0 ? (
          <p className="text-gray-500">No tests run yet</p>
        ) : (
          testResults.map((result, index) => (
            <div key={index} className="mb-1 p-1 bg-gray-50 rounded">
              {result}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
