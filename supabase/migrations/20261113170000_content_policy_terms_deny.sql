-- Explicit deny policy documents that content policy configuration is not client-readable.
drop policy if exists content_policy_terms_no_client_access on public.content_policy_terms;
create policy content_policy_terms_no_client_access
  on public.content_policy_terms for all to public
  using (false) with check (false);

