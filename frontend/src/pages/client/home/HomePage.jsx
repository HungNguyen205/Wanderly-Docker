import Hero from '@/components/client/Hero/Hero'
import Service from '@/components/client/Service/Service'
import React, { useEffect } from 'react'
import Header from '@/components/client/Layout/Header';
import AOS from 'aos';
import 'aos/dist/aos.css';

const HomePage = () => {
    useEffect(() => {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            mirror: false,
            offset: 100,
        });
    }, []);

    return (
        <>
            <Header />
            <Hero />
            <Service />
        </>
    )
}

export default HomePage

