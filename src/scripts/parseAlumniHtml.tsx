import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'node-html-parser';
import { createObjectCsvWriter } from 'csv-writer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AlumniProfile {
  name: string;
  title: string;
  linkedinUrl: string;
  imageUrl: string;
  degree?: string; // optional: · 2nd or similar
  location?: string; // optional if ever available
}

async function parseAlumniHtml() {
  try {
    const htmlPath = path.join(__dirname, '../html/Asia School of Business_ People _ LinkedIn.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    const root = parse(htmlContent);
    const alumniCards = root.querySelectorAll('.org-people-profile-card__profile-info');

    const alumniProfiles: AlumniProfile[] = [];

    alumniCards.forEach((card) => {
      try {
        const nameEl = card.querySelector('.artdeco-entity-lockup__title a div');
        const titleEl = card.querySelector('.artdeco-entity-lockup__subtitle div');
        const linkEl = card.querySelector('.artdeco-entity-lockup__title a');
        const imageEl = card.querySelector('.artdeco-entity-lockup__image img');
        const degreeEl = card.querySelector('.artdeco-entity-lockup__degree');

        const profile: AlumniProfile = {
          name: nameEl?.text.trim() || '',
          title: titleEl?.text.trim() || '',
          linkedinUrl: linkEl?.getAttribute('href') || '',
          imageUrl: imageEl?.getAttribute('src') || '',
          degree: degreeEl?.text.trim() || ''
        };

        if (profile.name && profile.linkedinUrl) {
          alumniProfiles.push(profile);
        }
      } catch (error) {
        console.error('❌ Error parsing one alumni card:', error);
      }
    });

    const csvWriter = createObjectCsvWriter({
      path: path.join(__dirname, '../data/alumni_profiles.csv'),
      header: [
        { id: 'name', title: 'Name' },
        { id: 'title', title: 'Title' },
        { id: 'linkedinUrl', title: 'LinkedIn URL' },
        { id: 'imageUrl', title: 'Image URL' },
        { id: 'degree', title: 'Connection' }
      ]
    });

    await csvWriter.writeRecords(alumniProfiles);
    console.log(`✅ Successfully parsed ${alumniProfiles.length} alumni profiles`);
  } catch (error) {
    console.error('❌ Error parsing HTML:', error);
  }
}

parseAlumniHtml();
