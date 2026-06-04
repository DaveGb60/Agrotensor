
CREATE POLICY "Deny all direct access" ON public.cloud_identities FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Deny all direct access" ON public.cloud_projects FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Deny all direct access" ON public.cloud_records FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Deny all direct access" ON public.cloud_backups FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
