import {
  createEmptyEuropassCv,
  createEmptyMotivationLetter,
  isEuropassCvComplete,
  isMotivationLetterComplete,
} from './europass';

describe('europass helpers', () => {
  it('validates cv completion requirements', () => {
    const cv = createEmptyEuropassCv();
    cv.profileTitle = 'Youth Volunteer';
    cv.summary =
      'I am a proactive university student who has led social projects and coordinated volunteers.';
    cv.keySkills = 'Communication, facilitation, planning and teamwork';
    cv.workExperiences[0] = {
      role: 'Volunteer Coordinator',
      organization: 'Inno Club',
      startDate: '2024-01',
      endDate: '2025-01',
      responsibilities: 'Led weekly activities and onboarding.',
    };
    cv.educationEntries[0] = {
      qualification: 'BSc Sociology',
      institution: 'Ankara University',
      startDate: '2022-09',
      endDate: '2026-06',
      description: 'Community development focus',
    };
    cv.languageSkills[0].language = 'English';
    cv.languageSkills[0].listening = 'B2';
    cv.languageSkills[0].reading = 'B2';
    cv.languageSkills[0].spokenInteraction = 'B2';
    cv.languageSkills[0].spokenProduction = 'B2';
    cv.languageSkills[0].writing = 'B2';

    expect(isEuropassCvComplete(cv)).toBe(true);
  });

  it('validates motivation letter completion requirements', () => {
    const letter = createEmptyMotivationLetter();
    letter.addressee = 'Selection Team';
    letter.subject = 'Motivation Letter for Youth Programme';
    letter.openingParagraph =
      'My name is Elif and I am applying to this programme because it aligns with my current social impact work and future development goals.';
    letter.motivationParagraph =
      'I want to join this programme to gain practical international experience, expand my understanding of civic engagement, and collaborate with peers across Europe while developing long term project management competences. The structured mentorship and project-based learning will help me transform volunteer experience into measurable outcomes for young participants.';
    letter.contributionParagraph =
      'I can contribute with volunteer mentoring experience, workshop facilitation, and community outreach planning. I have coordinated youth activities and can support communication, logistics, and participant engagement throughout the project period. I can also prepare simple impact tracking dashboards, coordinate peer feedback sessions, and help teams deliver inclusive and well documented outputs.';
    letter.closingParagraph =
      'Thank you for reviewing my application. I am available for interview and ready to contribute actively to all programme responsibilities during the entire project cycle.';

    expect(isMotivationLetterComplete(letter)).toBe(true);
  });
});
