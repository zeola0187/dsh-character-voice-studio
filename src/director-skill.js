import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../skills/character-voice-director/SKILL.md',import.meta.url),'utf8');
const [,header,content]=source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)||[];
if(!content)throw Error('Bundled Voice Director skill is missing its frontmatter/body');
export const directorSkill=Object.freeze({
  name:'character-voice-director',
  description:header.match(/^description: (.+)$/m)[1],
  source:'bundled',
  invocation:{modelInvocable:true,userInvocable:true},
  content
});
