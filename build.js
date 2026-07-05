const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const crypto = require('crypto');

// 1. Import the updated JSON mapping
const config = require('./resume-config.json');

const outDir = 'dist';
const generatedResumes = [];
let configChanged = false;

// Clean output directory for a fresh build
if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
}

// 2. Iterate over each entry in the JSON file
Object.entries(config).forEach(([resumeName, details]) => {
    // Generate a random path if one doesn't exist yet
    if (!details.urlPath) {
        details.urlPath = crypto.randomBytes(8).toString('hex');
        configChanged = true;
    }

    const { source, theme, urlPath } = details;
    const outFile = `${urlPath}.html`;
    const outFilePath = `${outDir}/${outFile}`;

    console.log(`\n⚙️ Building ${resumeName} resume (to URL path: /${outFile})...`);

    try {
        fs.mkdirSync(outDir, { recursive: true });

        // 3. Run the command using the configured source and theme
        const command = `npx resumed render ${source} -o ${outFilePath} -t ${theme}`;
        execSync(command, { stdio: 'inherit' });

        console.log(`✅ Successfully built: ${outFilePath}`);

        // Try reading title/name from source JSON for better UI, fallback to formatted resumeName
        let displayName = resumeName.charAt(0).toUpperCase() + resumeName.slice(1) + ' Profile';
        let subtitle = 'JSON Resume Profile';
        try {
            if (fs.existsSync(source)) {
                const data = JSON.parse(fs.readFileSync(source, 'utf8'));
                if (data.basics) {
                    if (data.basics.label) {
                        subtitle = data.basics.label;
                    }
                }
            }
        } catch (e) {
            // Ignore parse errors, fallback to default naming
        }

        generatedResumes.push({
            name: displayName,
            role: subtitle,
            fileName: outFile,
            key: resumeName
        });
    } catch (error) {
        console.error(`❌ Error building ${resumeName}:`, error.message);
        process.exit(1);
    }
});

// Save updated config if new paths were generated
if (configChanged) {
    fs.writeFileSync('./resume-config.json', JSON.stringify(config, null, 4) + '\n');
    console.log('📝 Updated resume-config.json with newly generated random URL paths.');
}


// 5. Generate index.html containing links to all built resumes
console.log(`\n📄 Generating index.html entrypoint...`);
try {
    const linksHtml = generatedResumes.map(resume => `
        <a href="${resume.fileName}" class="resume-card" id="card-${resume.key}">
            <div class="card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
            </div>
            <div class="card-content">
                <h3>${resume.name}</h3>
                <p>${resume.role}</p>
            </div>
            <div class="card-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
            </div>
        </a>
    `).join('\n');

    // Make sure we have name & info from first resume or generic values
    let candidateName = 'Developer';
    try {
        const firstSource = Object.values(config)[0]?.source;
        if (firstSource && fs.existsSync(firstSource)) {
            const data = JSON.parse(fs.readFileSync(firstSource, 'utf8'));
            if (data.basics && data.basics.name) {
                candidateName = data.basics.name;
            }
        }
    } catch(e) {}

    const initials = candidateName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${candidateName} - Professional Resumes</title>
    <meta name="description" content="Explore the professional resumes and career profiles for ${candidateName}.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-gradient-start: #0f172a;
            --bg-gradient-end: #020617;
            --card-bg: rgba(30, 41, 59, 0.4);
            --card-border: rgba(255, 255, 255, 0.08);
            --card-hover-border: rgba(99, 102, 241, 0.4);
            --card-hover-bg: rgba(30, 41, 59, 0.8);
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --accent-glow: rgba(99, 102, 241, 0.15);
            --accent-color: #6366f1;
            --accent-hover: #4f46e5;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: linear-gradient(135deg, var(--bg-gradient-start), var(--bg-gradient-end));
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
            overflow-x: hidden;
            position: relative;
        }

        /* Decorative background glow */
        body::before {
            content: '';
            position: absolute;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
            top: -100px;
            right: -100px;
            z-index: 0;
            pointer-events: none;
        }

        body::after {
            content: '';
            position: absolute;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
            bottom: -150px;
            left: -150px;
            z-index: 0;
            pointer-events: none;
        }

        .container {
            width: 100%;
            max-width: 680px;
            z-index: 10;
            position: relative;
            animation: fadeIn 0.8s ease-out;
        }

        header {
            text-align: center;
            margin-bottom: 3rem;
        }

        .avatar-placeholder {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
            border-radius: 50%;
            margin: 0 auto 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            font-weight: 700;
            color: white;
            box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
            border: 3px solid rgba(255, 255, 255, 0.1);
        }

        h1 {
            font-size: 2.2rem;
            font-weight: 800;
            letter-spacing: -0.025em;
            margin-bottom: 0.5rem;
            background: linear-gradient(to right, #ffffff, #cbd5e1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        header p {
            color: var(--text-secondary);
            font-size: 1.05rem;
            font-weight: 400;
            max-width: 480px;
            margin: 0 auto;
            line-height: 1.6;
        }

        .resume-list {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
            margin-bottom: 3rem;
        }

        .resume-card {
            display: flex;
            align-items: center;
            padding: 1.5rem;
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 16px;
            text-decoration: none;
            color: inherit;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .resume-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: var(--accent-color);
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .resume-card:hover {
            transform: translateY(-2px);
            background: var(--card-hover-bg);
            border-color: var(--card-hover-border);
            box-shadow: 0 12px 30px -10px rgba(0, 0, 0, 0.3);
        }

        .resume-card:hover::before {
            opacity: 1;
        }

        .card-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: rgba(99, 102, 241, 0.1);
            color: var(--accent-color);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 1.25rem;
            flex-shrink: 0;
            transition: transform 0.3s ease;
        }

        .resume-card:hover .card-icon {
            transform: scale(1.05);
            background: var(--accent-color);
            color: white;
        }

        .card-icon svg {
            width: 24px;
            height: 24px;
        }

        .card-content {
            flex-grow: 1;
        }

        .card-content h3 {
            font-size: 1.15rem;
            font-weight: 600;
            margin-bottom: 0.25rem;
            transition: color 0.3s ease;
        }

        .resume-card:hover .card-content h3 {
            color: #ffffff;
        }

        .card-content p {
            color: var(--text-secondary);
            font-size: 0.9rem;
            line-height: 1.4;
        }

        .card-arrow {
            color: var(--text-secondary);
            opacity: 0.5;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: 1rem;
        }

        .card-arrow svg {
            width: 20px;
            height: 20px;
        }

        .resume-card:hover .card-arrow {
            opacity: 1;
            color: var(--accent-color);
            transform: translateX(4px);
        }

        footer {
            text-align: center;
            color: var(--text-secondary);
            font-size: 0.8rem;
            opacity: 0.7;
        }

        footer a {
            color: var(--accent-color);
            text-decoration: none;
        }

        footer a:hover {
            text-decoration: underline;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @media (max-width: 480px) {
            h1 {
                font-size: 1.8rem;
            }
            .resume-card {
                padding: 1.25rem;
            }
            .card-icon {
                width: 40px;
                height: 40px;
                margin-right: 1rem;
            }
            .card-icon svg {
                width: 20px;
                height: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="avatar-placeholder">
                ${initials}
            </div>
            <h1>${candidateName}</h1>
            <p>Select a career profile version below to view the interactive resume.</p>
        </header>

        <main class="resume-list">
            ${linksHtml}
        </main>

        <footer>
            <p>Generated dynamically using <a href="https://jsonresume.org/" target="_blank" rel="noopener noreferrer">JSON Resume</a> and <a href="https://github.com/rburns/resumed" target="_blank" rel="noopener noreferrer">Resumed</a>.</p>
        </footer>
    </div>
</body>
</html>`;

    fs.writeFileSync(`${outDir}/index.html`, indexHtmlContent);
    console.log(`✅ Successfully generated index page: ${outDir}/index.html`);
} catch (error) {
    console.error(`❌ Error generating index.html:`, error.message);
    process.exit(1);
}