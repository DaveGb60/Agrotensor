const LandingFooter = () => {
  return (
    <footer id="contact" className="py-10 px-6 text-center bg-muted">
      <div className="max-w-6xl mx-auto">
        <p className="mb-2 font-medium">© FarmDesk — Your Farm's Digital Office</p>
        <p className="text-muted-foreground">
          Contact:{' '}
          <a href="mailto:hello@farmdesk.example" className="text-primary hover:underline">
            hello@farmdesk.example
          </a>
        </p>
      </div>
    </footer>
  );
};

export default LandingFooter;
