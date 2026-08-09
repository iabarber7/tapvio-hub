CREATE POLICY devices_claim_unassigned ON public.devices
FOR UPDATE
TO authenticated
USING (
  business_id IS NULL
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = devices.business_id
      AND (b.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);