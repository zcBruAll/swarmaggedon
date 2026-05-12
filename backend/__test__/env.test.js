import fs from 'fs';
import path from 'path';

describe('Environment Variables Consistency', () => {
    it('should ensure all variables defined in .env.example exist in .env', () => {
        const examplePath = path.resolve(process.cwd(), '../.env.example');
        const envPath = path.resolve(process.cwd(), '../.env');

        const exampleContent = fs.readFileSync(examplePath, 'utf8');
        const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

        const extractKeys = (content) => {
            return content
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'))
                .map(line => line.split('=')[0]);
        };

        const exampleKeys = extractKeys(exampleContent);
        const actualKeys = extractKeys(envContent);

        const missingKeys = exampleKeys.filter(key => !actualKeys.includes(key));
        expect(missingKeys).toEqual([]);
    });
});