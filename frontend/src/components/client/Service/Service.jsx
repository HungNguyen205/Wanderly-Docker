// Services.jsx
import React, { useState } from 'react';
import './Service.css';

const Services = () => {
    const [activeService, setActiveService] = useState('smarttrip');

    const servicesData = [
        {
            id: 'smarttrip',
            icon: '🌍',
            title: 'Smart Trip Planner',
            subtitle: 'Personalized travel itineraries for every style',
            content: {
                title: 'Smart Trip Planner',
                description: [
                    "Plan your journey effortlessly with our intelligent trip planner. The system analyzes your interests, budget, and location to create an optimized itinerary that saves both time and cost.",
                    "It automatically sorts destinations, suggests the best schedule based on weather forecasts, and keeps you updated on local events, ensuring every trip feels like it was made just for you."
                ],
                features: [
                    'AI‑powered destination and activity recommendations',
                    'Smart route optimization with real‑world maps',
                    'Export itineraries to PDF or share with travel partners',
                    'Real‑time weather and safety alerts for every stop',
                ]
            }
        },
        {
            id: 'booking',
            icon: '🏨',
            title: 'Easy Booking Services',
            subtitle: 'Book stays, rides, and experiences in one place',
            content: {
                title: 'Easy Booking Services',
                description: [
                    "Discover thousands of accommodations, vehicles, and local activities at your fingertips. We combine trustworthy community reviews and intelligent filters to help you find exactly what you need—quickly and securely.",
                    "From cozy homestays to day tours and foodie experiences, everything you need for your trip can be booked seamlessly in one platform."
                ],
                features: [
                    'Advanced filtering by price, ratings, and distance',
                    'Instant booking, cancellation, and secure payment',
                    'Map‑based search and route optimization',
                    'Smart suggestions based on your current itinerary',
                ]
            }
        },
        {
            id: 'travelcommunity',
            icon: '✈️',
            title: 'Travel Community & Sharing',
            subtitle: 'Where travelers connect and inspire each other',
            content: {
                title: 'Travel Community & Sharing',
                description: [
                    "Join a vibrant community of independent travelers. Write blogs, share reviews, upload your photos, and inspire others with your real‑world travel stories.",
                    "Follow like‑minded explorers, exchange tips through comments, and discover top‑rated destinations or itineraries loved by the community."
                ],
                features: [
                    'Publish travel blogs and media galleries',
                    'Like, comment, and share inspiring journeys',
                    'Follow other travelers and create groups',
                    'Explore trending destinations and top itineraries',
                ]
            }
        },
        {
            id: 'smartpayment',
            icon: '💳',
            title: 'Smart Payments & Rewards',
            subtitle: 'Fast, secure, and rewarding transactions',
            content: {
                title: 'Smart Payments & Rewards',
                description: [
                    "Enjoy seamless, secure payments with multiple options—from credit cards to e‑wallets. Our integrated reward system adds more value to every booking with points, discounts, and personalized promotions.",
                    "Every transaction is safely stored, and your invoices are always accessible for quick reference and expense tracking."
                ],
                features: [
                    'Support for global payment gateways and e‑wallets',
                    'Manage promo codes and membership rewards',
                    'Automatic invoice and transaction history tracking',
                    ' PCI DSS‑compliant security for all transactions',
                ]
            }
        }
    ];

    return (
        <section id="services" className="section services">
            <div className="section-container">
                <div className="section-header">
                    <h2 className="section-title">Our Services</h2>
                    <p className="section-subtitle">
                        Title.
                    </p>
                </div>

                <div className="services-container">
                    <div className="services-tabs">
                        {servicesData.map((service) => (
                            <div
                                key={service.id}
                                className={`service-tab ${activeService === service.id ? 'active' : ''}`}
                                data-service={service.id}
                                onClick={() => setActiveService(service.id)}
                            >
                                <span className="service-tab-icon">{service.icon}</span>
                                <h3>{service.title}</h3>
                                <p>{service.subtitle}</p>
                            </div>
                        ))}
                    </div>

                    <div className="services-content">
                        {servicesData.map((service) => (
                            <div
                                key={service.id}
                                className={`service-content ${activeService === service.id ? 'active' : ''}`}
                                id={service.id}
                            >
                                <div className="service-content-icon">{service.icon}</div>
                                <h2>{service.content.title}</h2>
                                {service.content.description.map((paragraph, index) => (
                                    <p key={index}>{paragraph}</p>
                                ))}
                                <ul className="service-features">
                                    {service.content.features.map((feature, index) => (
                                        <li key={index}>{feature}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Services;