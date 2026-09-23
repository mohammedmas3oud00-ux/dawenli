import { notFound } from "next/navigation"; 
 
/** Catches unknown paths under a valid locale so `not-found.tsx` renders localized. */ 
export default function CatchAll() { 
  notFound(); 
}
