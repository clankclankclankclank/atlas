import {SEAudioLibrary} from './audio-library.jsx';
import {Layers3} from 'lucide-react';
import {createPaperWorkbench} from '../paper-workbench.jsx';
import data from './study-data.json';
import clips from './reward-clips.json';
import formulaDetails from './formula-details.json';
import {labs,calculate} from './calculators.js';

export const mount=createPaperWorkbench({
 subject:'se',title:'Software Engineering',brand:'Software Atlas',tag:'ENGINEERING STUDIO',
 BrandIcon:Layers3,period:'Autumn papers 2022–2025',data,papers:['S2','S1','S3','S5','S4'],
 clips,labs,calculate,formulaDetails,Listening:SEAudioLibrary,
 searchHint:'Search DFD, COCOMO, Scrum…',
 formulaHint:'Search COCOMO, CPM, function points…',
 diagramHint:'Search Judiciary, PERT, library…',
 labHint:'Try the key estimation, testing, scheduling and reliability calculations.'
});
