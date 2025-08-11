import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Templates() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have resume data in sessionStorage
    const resumeData = sessionStorage.getItem('refinedResumeJson');
    if (!resumeData) {
      router.push('/');
      return;
    }
    setIsLoading(false);
  }, [router]);

  const handleTemplateSelect = (templateId: number) => {
    // Store the selected template in sessionStorage
    sessionStorage.setItem('selectedTemplate', templateId.toString());
    router.push('/portfolio');
  };

  const templates = [
    {
      id: 1,
      name: 'Classic',
      description: 'Clean and professional design',
      image: '/template1.png', // You can add template preview images later
      isAvailable: true
    },
    {
      id: 2,
      name: 'Modern',
      description: 'Contemporary and sleek layout',
      image: '/template2.png',
      isAvailable: true
    },
    {
      id: 3,
      name: 'Creative',
      description: 'Bold and artistic presentation',
      image: '/template3.png',
      isAvailable: false
    },
    {
      id: 4,
      name: 'Minimal',
      description: 'Simple and elegant design',
      image: '/template4.png',
      isAvailable: false
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Choose Template - Typefolio</title>
      </Head>
      <div className="min-h-screen bg-black text-white overflow-hidden">
        {/* Logo */}
        <div className="absolute top-6 left-6">
          <img 
            src="/Logo.png" 
            alt="Typefolio" 
            className="h-16 w-auto"
          />
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium mb-8 leading-tight">
                Choose Your Template
              </h1>
              <p className="text-xl text-gray-300">
                Select a design that best represents your style
              </p>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`relative rounded-2xl border-2 p-8 transition-all duration-300 ${
                    template.isAvailable
                      ? 'border-white bg-black hover:border-gray-400 cursor-pointer'
                      : 'border-gray-600 bg-gray-900 cursor-not-allowed opacity-50'
                  }`}
                  onClick={() => template.isAvailable && handleTemplateSelect(template.id)}
                >
                  {/* Template Preview Placeholder */}
                  <div className="aspect-video bg-gray-800 rounded-lg mb-6 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📄</div>
                      <p className="text-gray-400">Template {template.id}</p>
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="text-center">
                    <h3 className="text-2xl font-medium mb-2">{template.name}</h3>
                    <p className="text-gray-300 mb-4">{template.description}</p>
                    
                    {template.isAvailable ? (
                      <button className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                        Select Template
                      </button>
                    ) : (
                      <div className="text-gray-500">
                        <p>Coming Soon</p>
                      </div>
                    )}
                  </div>

                  {/* Available Badge */}
                  {template.isAvailable && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Available
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Back Button */}
            <div className="text-center">
              <button
                onClick={() => router.push('/results')}
                className="bg-gray-800 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-600"
              >
                Back to Results
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 