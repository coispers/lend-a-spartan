'use client';

import React from 'react';

interface ReCaptchaProviderProps {
    children: React.ReactNode;
}

const ReCaptchaProvider: React.FC<ReCaptchaProviderProps> = ({
    children
}) => {
    return <>{children}</>;
};

export default ReCaptchaProvider;