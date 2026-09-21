import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const HeaderWithDateTime = ({ title }) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex justify-between items-center mb-6 no-print">
            <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
            <div className="text-right">
                <p className="text-sm font-medium text-slate-600">
                    {format(now, "eeee, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <p className="text-xs text-slate-400">
                    {format(now, "HH:mm")}
                </p>
            </div>
        </div>
    );
};

export default HeaderWithDateTime;
