import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@components/ui/Button';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Alex Johnson',
    role: 'Founder & CEO',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    bio: 'Alex founded QuickSparks with the mission to make document conversion accessible to everyone. With 15+ years of experience in document management systems.',
  },
  {
    name: 'Sarah Chen',
    role: 'CTO',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    bio: 'Sarah leads our engineering team and has developed our proprietary conversion algorithms. Previously worked at Adobe and Microsoft.',
  },
  {
    name: 'Michael Rodriguez',
    role: 'Head of Product',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    bio: 'Michael ensures our products meet the highest standards of usability and performance. He brings 10+ years of experience in UX design.',
  },
];

const AboutPage: React.FC = (): React.ReactElement => {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
            About QuickSparks
          </h1>
          <p className="text-xl text-gray-500">
            We're on a mission to make document conversion simple, fast, and accessible to everyone.
          </p>
        </div>

        {/* Our Story */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Story</h2>
          <div className="prose prose-lg mx-auto">
            <p>
              QuickSparks was founded in 2022 with a simple goal: to solve the frustrating problem of
              document conversion. After struggling with poor-quality conversions and complex software,
              our founder Alex decided there had to be a better way.
            </p>
            <p>
              What started as a simple tool for personal use quickly grew into a comprehensive platform
              serving thousands of users daily. We've built our technology from the ground up, focusing on
              conversion quality and ease of use above all else.
            </p>
            <p>
              Today, QuickSparks is trusted by individuals, small businesses, and enterprise clients around the world.
              We're proud to have helped convert millions of documents while maintaining our commitment to quality,
              security, and customer satisfaction.
            </p>
          </div>
        </div>

        {/* Our Values */}
        <div className="bg-gray-50 py-12 rounded-xl mb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                  <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Quality First</h3>
                <p className="text-gray-500">
                  We never compromise on conversion quality, ensuring your documents maintain their formatting and content.
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                  <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Simplicity</h3>
                <p className="text-gray-500">
                  We believe powerful tools should be easy to use. Our interface is designed for everyone, not just technical users.
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                  <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Security</h3>
                <p className="text-gray-500">
                  Your documents are private and secure. We use encryption throughout our system and never share your data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Meet Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map(member => (
              <div key={member.name} className="text-center">
                <img 
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover" 
                  src={member.image} 
                  alt={member.name} 
                />
                <h3 className="text-xl font-medium text-gray-900">{member.name}</h3>
                <p className="text-primary-600 mb-2">{member.role}</p>
                <p className="text-gray-500 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-primary-600 text-white py-12 rounded-xl mb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-10 text-center">QuickSparks in Numbers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">2M+</div>
                <div className="text-primary-200">Documents Converted</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">50K+</div>
                <div className="text-primary-200">Active Users</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">99.9%</div>
                <div className="text-primary-200">Uptime</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">4.8/5</div>
                <div className="text-primary-200">Customer Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to get started?</h2>
          <p className="text-xl text-gray-500 mb-8">
            Join thousands of satisfied users who trust QuickSparks for their document conversion needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/convert">
              <Button variant="primary" size="lg">
                Start Converting
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;