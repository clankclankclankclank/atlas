import {Server} from 'lucide-react';
import {createPaperWorkbench} from '../paper-workbench.jsx';
import * as data from './course.mjs';
import formulaDetails from './formula-details.json';
import clips from '../se/reward-clips.json';
import {labs,calculate} from './calculators.js';

export const mount=createPaperWorkbench({
 subject:'dos',title:'Distributed Operating Systems',brand:'Distributed OS Atlas',tag:'DISTRIBUTED SYSTEMS',
 BrandIcon:Server,period:'Autumn papers 2024–2025',data,papers:Object.keys(data.PAPERS),
 clips,labs,calculate,formulaDetails,
 searchHint:'Search RPC, Berkeley, deadlock…',
 formulaHint:'Search clock skew, RPC, Omega…',
 diagramHint:'Search Omega, Bully, RPC…',
 labHint:'Calculate RPC time, clock adjustments, and Omega network size.'
});
