import ManualList from "../components/manuallist/ManualList";

ManualList

const Manual = () => {
    return (
        <div className="manual">
            <h1 style={{ textAlign: 'center', paddingTop: '20px' }}>Manual</h1>
            <ManualList/>
        </div>
    );
};

export default Manual;