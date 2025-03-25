import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@components/ui/Button';

// Product feature types
interface ProductFeature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

// Testimonial types
interface Testimonial {
  content: string;
  author: string;
  role: string;
  company: string;
}

// FAQ item types
interface FAQItem {
  question: string;
  answer: string;
}

const ProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<'pdf-to-docx' | 'docx-to-pdf'>('pdf-to-docx');
  
  // Icons
  const QualityIcon = (
    <svg className="w-6 h-6 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
  
  const SpeedIcon = (
    <svg className="w-6 h-6 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
  
  const SecureIcon = (
    <svg className="w-6 h-6 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
  
  const EasyIcon = (
    <svg className="w-6 h-6 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  );
  
  // Product features
  const productFeatures: ProductFeature[] = [
    {
      title: "Superior Conversion Quality",
      description: "Our advanced algorithms preserve formatting, tables, images, and fonts, ensuring your document looks the same after conversion.",
      icon: QualityIcon
    },
    {
      title: "Lightning-Fast Processing",
      description: "Convert your documents in seconds, not minutes. Our optimized platform handles even large files quickly and efficiently.",
      icon: SpeedIcon
    },
    {
      title: "Bank-Level Security",
      description: "Your documents are encrypted during upload, processing, and storage. Files are automatically deleted after processing.",
      icon: SecureIcon
    },
    {
      title: "Simple 3-Step Process",
      description: "Just upload, convert, and download. No registration required, no complicated settings - just instant results.",
      icon: EasyIcon
    }
  ];
  
  // Testimonials
  const testimonials: Testimonial[] = [
    {
      content: "This service saved me hours of manual reformatting. The conversion quality is outstanding compared to other tools I've tried.",
      author: "Sarah Johnson",
      role: "Marketing Manager",
      company: "TechCorp"
    },
    {
      content: "I needed to convert a legal document quickly and with perfect formatting. This tool delivered exactly what I needed in seconds.",
      author: "Michael Chen",
      role: "Legal Consultant",
      company: "LegalPro Services"
    },
    {
      content: "As a teacher, I convert dozens of worksheets weekly. This has become my go-to tool for reliable, high-quality conversions.",
      author: "Emily Rodriguez",
      role: "High School Teacher",
      company: "Lincoln Academy"
    }
  ];
  
  // FAQ items
  const faqItems: FAQItem[] = [
    {
      question: "How accurate is the conversion?",
      answer: "Our conversion engine maintains over 98% formatting accuracy, preserving text, images, tables, fonts, and layouts. For complex documents, we offer a high-quality conversion option that provides even better results."
    },
    {
      question: "Is there a file size limit?",
      answer: "Free users can convert files up to 5MB, while paid conversions support files up to 50MB. For larger files or bulk conversions, please contact us for custom solutions."
    },
    {
      question: "How secure is my data?",
      answer: "We take security seriously. All file transfers use SSL encryption, files are stored encrypted, and we automatically delete files after processing is complete. We never access the content of your documents."
    },
    {
      question: "Can I convert multiple files at once?",
      answer: "Our service currently processes one file at a time for optimal quality. For bulk conversion needs, please check our premium plans or contact us for custom solutions."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, and PayPal. Payments are processed securely through our payment provider."
    }
  ];
  
  // Handle conversion option change
  const handleOptionChange = (option: 'pdf-to-docx' | 'docx-to-pdf') => {
    setSelectedOption(option);
  };
  
  // Handle try now button click
  const handleTryNow = () => {
    navigate('/convert', { state: { defaultOption: selectedOption } });
  };
  
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="container mx-auto px-4 py-20 sm:py-24 relative z-10">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-1/2 mb-12 lg:mb-0">
              <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                Professional Document Conversion in Seconds
              </h1>
              <p className="text-xl mb-8 opacity-90">
                Convert between PDF and DOCX with perfect formatting and lightning-fast speed. No software to install, no registration required.
              </p>
              
              <div className="bg-white bg-opacity-10 p-4 rounded-lg mb-8">
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={() => handleOptionChange('pdf-to-docx')}
                    className={`px-6 py-3 rounded-lg flex items-center justify-center ${
                      selectedOption === 'pdf-to-docx' 
                        ? 'bg-white text-primary-700 font-medium' 
                        : 'bg-transparent border border-white'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 3.5L18.5 8H14V3.5zM16 20H8v-2h8v2zm0-4H8v-2h8v2z" />
                    </svg>
                    PDF to DOCX
                  </button>
                  
                  <button
                    onClick={() => handleOptionChange('docx-to-pdf')}
                    className={`px-6 py-3 rounded-lg flex items-center justify-center ${
                      selectedOption === 'docx-to-pdf' 
                        ? 'bg-white text-primary-700 font-medium' 
                        : 'bg-transparent border border-white'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm12 6V9h-4V7H8v8h4v-2h4z" />
                    </svg>
                    DOCX to PDF
                  </button>
                </div>
              </div>
              
              <Button 
                variant="primary" 
                size="lg"
                className="bg-white text-primary-700 hover:bg-gray-100"
                onClick={handleTryNow}
              >
                Try Now - It's Free
              </Button>
              
              <p className="mt-4 text-sm opacity-75">
                No credit card required. Free tier available with limited features.
              </p>
            </div>
            
            <div className="w-full lg:w-1/2 lg:pl-12">
              <div className="bg-white p-1 rounded-lg shadow-xl">
                <img 
                  src="/images/document-conversion-demo.png" 
                  alt="Document conversion preview" 
                  className="rounded-md w-full"
                  onError={(e) => {
                    // Fallback if image doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="none"%3e%3crect width="400" height="300" fill="%23e2e8f0"/%3e%3ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14px" fill="%236b7280"%3eDocument Conversion Preview%3c/text%3e%3c/svg%3e';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Conversion Service?</h2>
            <p className="text-lg text-gray-600">
              Our powerful technology ensures your documents look perfect after conversion, saving you hours of manual formatting.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {productFeatures.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">
              Converting your documents is as easy as 1-2-3
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-center max-w-5xl mx-auto">
            <div className="w-full md:w-1/3 text-center px-4 mb-8 md:mb-0">
              <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your File</h3>
              <p className="text-gray-600">Simply drag and drop your PDF or DOCX file onto our secure uploader.</p>
            </div>
            
            <div className="hidden md:block w-6 border-t-2 border-primary-200 mx-4">
              {/* Divider */}
            </div>
            
            <div className="w-full md:w-1/3 text-center px-4 mb-8 md:mb-0">
              <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Convert</h3>
              <p className="text-gray-600">Our advanced algorithms convert your document while preserving all formatting.</p>
            </div>
            
            <div className="hidden md:block w-6 border-t-2 border-primary-200 mx-4">
              {/* Divider */}
            </div>
            
            <div className="w-full md:w-1/3 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Download</h3>
              <p className="text-gray-600">Preview and download your perfectly converted document instantly.</p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button 
              variant="primary" 
              size="lg"
              onClick={handleTryNow}
            >
              Convert Your Document Now
            </Button>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
            <p className="text-lg text-gray-600">
              Join thousands of satisfied users who trust our conversion service
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <svg className="text-primary-400 w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
                
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}, {testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Pricing CTA */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-8 md:p-12 text-white">
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold mb-4">Ready to Convert Your Documents?</h2>
                <p className="text-xl mb-8 opacity-90">
                  Start with our free tier or choose a premium plan for additional features.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="bg-white text-primary-700 hover:bg-gray-100 border-white"
                    onClick={handleTryNow}
                  >
                    Try For Free
                  </Button>
                  
                  <Link to="/pricing">
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="border-white text-white hover:bg-white hover:text-primary-700"
                    >
                      View Pricing
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">
              Got questions? We've got answers.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="divide-y divide-gray-200">
              {faqItems.map((item, index) => (
                <div key={index} className="py-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.question}</h3>
                  <p className="text-gray-600">{item.answer}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">Still have questions?</p>
              <Link to="/contact">
                <Button variant="outline" size="lg">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductPage;