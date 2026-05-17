
revoke execute on function public.book_seats(uuid, text[]) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
