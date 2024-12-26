import React from 'react';

interface FormattedResponseProps {
    content: string;
}

export const FormattedResponse: React.FC<FormattedResponseProps> = ({ content }) => {
    // Replace XML tags with bold text
    const formattedContent = content
        // Opening tags
        .replace(/<разбор_сценария>/g, '**Разбор сценария:**\n')
        .replace(/<предложения>/g, '**Предложения:**\n')
        .replace(/<объяснение>/g, '**Объяснение:**\n')
        .replace(/<поддержка>/g, '**Поддержка:**\n')
        // Closing tags
        .replace(/<\/разбор_сценария>/g, '\n')
        .replace(/<\/предложения>/g, '\n')
        .replace(/<\/объяснение>/g, '\n')
        .replace(/<\/поддержка>/g, '\n');

    // Split into paragraphs and render
    const paragraphs = formattedContent.split('\n').map((paragraph, index) => {
        if (!paragraph.trim()) return null;

        // Check if this is a header (starts with **)
        const isHeader = paragraph.startsWith('**') && paragraph.endsWith('**');
        
        if (isHeader) {
            // Remove ** and : from header
            const headerText = paragraph.replace(/\*\*/g, '').replace(':', '');
            return (
                <h3 key={index} className="font-bold text-base mt-4 mb-2 text-foreground">
                    {headerText}
                </h3>
            );
        }

        return (
            <p key={index} className="text-sm text-muted-foreground">
                {paragraph}
            </p>
        );
    });

    return (
        <div className="formatted-response space-y-1">
            {paragraphs.filter(p => p !== null)}
        </div>
    );
}; 