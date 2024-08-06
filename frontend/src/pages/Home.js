import TicketList from "../components/ticketlist/TicketList";

const Home = () => {
    return (
        <div className="home">
            <h1 style={{ textAlign: 'center', paddingTop: '20px' }}>Home</h1>
            <TicketList />
        </div>
    );
};

export default Home;