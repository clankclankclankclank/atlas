export function reportFailedSignIn() {
  const endpoint = document.querySelector('meta[name="atlas-alert-endpoint"]')?.content;
  if (!endpoint) return;
  // The alert is optional and never delays the password form.
  fetch(endpoint,{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',keepalive:true}).catch(()=>{});
}
