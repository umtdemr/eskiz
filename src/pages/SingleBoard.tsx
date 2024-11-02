import {useParams} from "react-router-dom";

export default function SingleBoard() {
    const params = useParams()
    
    return (
        <div>board ={ params.id }</div>
    )
}