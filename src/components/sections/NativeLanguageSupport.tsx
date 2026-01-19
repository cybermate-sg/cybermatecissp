'use client';

import React from 'react';
import Image from 'next/image';

const COUNTRIES = [
    {
        code: 'us',
        name: 'United States',
        languages: [{ code: 'en', name: 'English', label: 'ENG' }],
    },
    {
        code: 'es',
        name: 'Spain',
        languages: [{ code: 'es', name: 'Spanish', label: 'SPA' }],
    },
    {
        code: 'fr',
        name: 'France',
        languages: [{ code: 'fr', name: 'French', label: 'FRE' }],
    },
    {
        code: 'de',
        name: 'Germany',
        languages: [{ code: 'de', name: 'German', label: 'GER' }],
    },
    {
        code: 'sa',
        name: 'Saudi Arabia',
        languages: [{ code: 'ar', name: 'Arabic', label: 'ARA' }],
    },
    {
        code: 'cn',
        name: 'China',
        languages: [{ code: 'zh-CN', name: 'Chinese (Simplified)', label: 'ZHO' }],
    },
    {
        code: 'tw',
        name: 'Taiwan',
        languages: [{ code: 'zh-TW', name: 'Chinese (Traditional)', label: 'ZHO' }],
    },
    {
        code: 'in',
        name: 'India',
        languages: [
            { code: 'hi', name: 'Hindi', label: 'HIN' },
            { code: 'gu', name: 'Gujarati', label: 'GUJ' },
            { code: 'kn', name: 'Kannada', label: 'KAN' },
            { code: 'ml', name: 'Malayalam', label: 'MAL' },
            { code: 'mr', name: 'Marathi', label: 'MAR' },
            { code: 'ta', name: 'Tamil', label: 'TAM' },
            { code: 'te', name: 'Telugu', label: 'TEL' },
        ],
    },
    {
        code: 'jp',
        name: 'Japan',
        languages: [{ code: 'ja', name: 'Japanese', label: 'JPN' }],
    },
    {
        code: 'kr',
        name: 'South Korea',
        languages: [{ code: 'ko', name: 'Korean', label: 'KOR' }],
    },
    {
        code: 'pt',
        name: 'Portugal',
        languages: [{ code: 'pt', name: 'Portuguese', label: 'POR' }],
    },
    {
        code: 'ru',
        name: 'Russia',
        languages: [{ code: 'ru', name: 'Russian', label: 'RUS' }],
    },
    {
        code: 'it',
        name: 'Italy',
        languages: [{ code: 'it', name: 'Italian', label: 'ITA' }],
    },
    {
        code: 'nl',
        name: 'Netherlands',
        languages: [{ code: 'nl', name: 'Dutch', label: 'NLD' }],
    },
    {
        code: 'pl',
        name: 'Poland',
        languages: [{ code: 'pl', name: 'Polish', label: 'POL' }],
    },
    {
        code: 'tr',
        name: 'Turkey',
        languages: [{ code: 'tr', name: 'Turkish', label: 'TUR' }],
    },
    {
        code: 'pk',
        name: 'Pakistan',
        languages: [{ code: 'ur', name: 'Urdu', label: 'URD' }],
    },
    {
        code: 'vn',
        name: 'Vietnam',
        languages: [{ code: 'vi', name: 'Vietnamese', label: 'VIE' }],
    },
    {
        code: 'th',
        name: 'Thailand',
        languages: [{ code: 'th', name: 'Thai', label: 'THA' }],
    },
];

export default function NativeLanguageSupport() {
    return (
        <section className="w-full py-8 md:py-12 bg-[#0f1729] border-b border-white/5 relative z-10">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="flex flex-col items-center text-center space-y-6">
                    <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 max-w-4xl mx-auto leading-relaxed">
                        CISSP MASTERY with native language support for the first time to enhance
                        your understanding and pass CISSP confidently
                    </h2>

                    <div className="flex flex-wrap justify-center gap-6 md:gap-8 max-w-5xl mx-auto mt-4 px-2">
                        {COUNTRIES.map((country) => (
                            <div
                                key={country.code}
                                className="group relative flex flex-col items-center p-2 rounded-lg transition-all duration-300 hover:bg-white/5"
                            >
                                <div
                                    className="relative w-8 h-6 md:w-10 md:h-7 shadow-lg rounded overflow-hidden transition-transform duration-300 group-hover:scale-110 group-hover:shadow-blue-500/20 mb-2"
                                    title={country.name}
                                >
                                    <Image
                                        src={`https://flagcdn.com/${country.code}.svg`}
                                        alt={`${country.name} flag`}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 32px, 40px"
                                    />
                                </div>

                                <div className={`flex ${country.languages.length > 1 ? 'flex-wrap justify-center gap-x-2 gap-y-1 max-w-[120px]' : 'justify-center'}`}>
                                    {country.languages.map((lang) => (
                                        <span
                                            key={lang.code}
                                            className="text-[10px] md:text-xs font-medium text-slate-400 group-hover:text-blue-400 transition-colors uppercase tracking-wider"
                                            title={lang.name}
                                        >
                                            {lang.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
