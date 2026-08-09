CREATE POLICY "business_images_read" ON storage.objects
FOR SELECT USING (bucket_id = 'business-images');

CREATE POLICY "business_images_owner_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'business-images'
  AND EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id::text = (storage.foldername(name))[1]
      AND (b.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "business_images_owner_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'business-images'
  AND EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id::text = (storage.foldername(name))[1]
      AND (b.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "business_images_owner_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'business-images'
  AND EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id::text = (storage.foldername(name))[1]
      AND (b.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);